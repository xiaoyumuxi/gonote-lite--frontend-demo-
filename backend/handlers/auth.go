package handlers

import (
	"net/http"
	"gonote/db"
	"gonote/models"
	
	"github.com/gin-gonic/gin"
)

// Mock Auth logic for demo
func Login(c *gin.Context) {
	var loginData struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// In real app, verify password hash
	var user models.User
	if err := db.DB.Where("username = ?", loginData.Username).First(&user).Error; err != nil {
		// Auto-register for demo if not found
		user = models.User{
			ID:       "u-" + loginData.Username, // Simple mock ID
			Username: loginData.Username,
			AvatarColor: "bg-blue-500",
		}
		db.DB.Create(&user)
	}

	c.JSON(http.StatusOK, gin.H{
		"token": "mock-jwt-token-for-" + user.ID,
		"user": user,
	})
}
