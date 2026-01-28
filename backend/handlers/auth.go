package handlers

import (
	"gonote/db"
	"gonote/middleware"
	"gonote/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Login - 用户登录，返回 JWT Token
func Login(c *gin.Context) {
	var loginData struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名和密码不能为空"})
		return
	}

	// 查找用户
	var user models.User
	if err := db.DB.Where("username = ?", loginData.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(loginData.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 生成 JWT Token
	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "登录失败，请重试"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// RegisterRequest - 请求注册，生成验证码（打印到控制台）
func RegisterRequest(c *gin.Context) {
	var registerData struct {
		Username string `json:"username" binding:"required,min=3,max=20"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&registerData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名至少3个字符，密码至少6个字符"})
		return
	}

	// 检查用户名是否已存在
	var existingUser models.User
	if err := db.DB.Where("username = ?", registerData.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "用户名已被注册"})
		return
	}

	// 生成验证码并打印到控制台
	middleware.GenerateVerificationCode(registerData.Username, registerData.Password)

	c.JSON(http.StatusOK, gin.H{
		"message":  "验证码已发送，请联系管理员获取",
		"username": registerData.Username,
	})
}

// RegisterVerify - 验证验证码并完成注册
func RegisterVerify(c *gin.Context) {
	var verifyData struct {
		Username string `json:"username" binding:"required"`
		Code     string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&verifyData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请输入用户名和验证码"})
		return
	}

	// 验证验证码
	password, valid := middleware.VerifyCode(verifyData.Username, verifyData.Code)
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "验证码错误或已过期"})
		return
	}

	// 密码哈希
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败，请稍后重试"})
		return
	}

	// 创建新用户
	newUser := models.User{
		ID:           "u-" + verifyData.Username,
		Username:     verifyData.Username,
		PasswordHash: string(hashedPassword),
		AvatarColor:  "bg-blue-500",
	}

	if err := db.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败，请稍后重试"})
		return
	}

	// 生成 JWT Token
	token, err := middleware.GenerateToken(newUser.ID, newUser.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册成功，但登录失败"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "注册成功",
		"token":   token,
		"user":    newUser,
	})
}

// Register - 保留旧接口（兼容，但不推荐使用）
func Register(c *gin.Context) {
	c.JSON(http.StatusBadRequest, gin.H{
		"error":   "请使用新的注册流程",
		"message": "先调用 /api/auth/register/request，再调用 /api/auth/register/verify",
	})
}
