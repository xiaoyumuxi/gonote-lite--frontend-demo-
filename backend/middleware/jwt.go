package middleware

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWT 密钥 - 生产环境应从环境变量读取
var jwtSecret = []byte("gonote-secret-key-2026")

// Token 有效期
const tokenExpiry = 7 * 24 * time.Hour // 7 天

// Claims 自定义 JWT 声明
type Claims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateToken 生成 JWT Token
func GenerateToken(userID, username string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "gonote",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ParseToken 解析并验证 JWT Token
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// JWTAuthMiddleware JWT 认证中间件
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 跳过认证的路由
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/auth/") {
			c.Next()
			return
		}

		// 从 Header 获取 Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			c.Abort()
			return
		}

		// 解析 Bearer Token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 格式错误"})
			c.Abort()
			return
		}

		// 验证 Token
		claims, err := ParseToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 无效或已过期"})
			c.Abort()
			return
		}

		// 将用户信息存入上下文
		c.Set("userId", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}

// ========== 验证码管理 ==========

// 验证码存储（内存中，简化实现）
var (
	verificationCodes = make(map[string]codeInfo)
	codeMutex         sync.RWMutex
)

type codeInfo struct {
	Code      string
	Username  string
	Password  string // 临时存储，验证通过后用于创建用户
	ExpiresAt time.Time
}

// GenerateVerificationCode 生成 6 位验证码并打印到控制台
func GenerateVerificationCode(username, password string) string {
	code := generateRandomCode(6)

	codeMutex.Lock()
	verificationCodes[username] = codeInfo{
		Code:      code,
		Username:  username,
		Password:  password,
		ExpiresAt: time.Now().Add(10 * time.Minute), // 10 分钟有效
	}
	codeMutex.Unlock()

	// 打印到控制台 - 管理员可以看到
	log.Printf("\n")
	log.Printf("========================================")
	log.Printf("📝 新用户注册请求")
	log.Printf("   用户名: %s", username)
	log.Printf("   验证码: %s", code)
	log.Printf("   有效期: 10 分钟")
	log.Printf("========================================")
	log.Printf("\n")

	return code
}

// VerifyCode 验证验证码
func VerifyCode(username, code string) (string, bool) {
	codeMutex.RLock()
	info, exists := verificationCodes[username]
	codeMutex.RUnlock()

	if !exists {
		return "", false
	}

	if time.Now().After(info.ExpiresAt) {
		// 过期，删除
		codeMutex.Lock()
		delete(verificationCodes, username)
		codeMutex.Unlock()
		return "", false
	}

	if info.Code != code {
		return "", false
	}

	// 验证成功，返回密码并删除记录
	codeMutex.Lock()
	delete(verificationCodes, username)
	codeMutex.Unlock()

	return info.Password, true
}

// generateRandomCode 生成随机数字验证码
func generateRandomCode(length int) string {
	const digits = "0123456789"
	b := make([]byte, length)
	rand.Read(b)
	for i := range b {
		b[i] = digits[int(b[i])%len(digits)]
	}
	return string(b)
}
