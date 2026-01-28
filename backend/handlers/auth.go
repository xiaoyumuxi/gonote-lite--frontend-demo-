package handlers

import (
	"net/http"
	"gonote/db"
	"gonote/models"
	
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Login - 仅验证已存在的用户，不自动注册
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

	c.JSON(http.StatusOK, gin.H{
		"token": "mock-jwt-token-for-" + user.ID,
		"user": user,
	})
}

// Register - 新用户注册
func Register(c *gin.Context) {
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

	// 密码哈希
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(registerData.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败，请稍后重试"})
		return
	}

	// 创建新用户
	newUser := models.User{
		ID:           "u-" + registerData.Username,
		Username:     registerData.Username,
		PasswordHash: string(hashedPassword),
		AvatarColor:  "bg-blue-500",
	}

	if err := db.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败，请稍后重试"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "注册成功",
		"token":   "mock-jwt-token-for-" + newUser.ID,
		"user":    newUser,
	})
}

