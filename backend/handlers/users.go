package handlers

import (
	"gonote/db"
	"gonote/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// SearchUsers - GET /api/users/search?q=...
func SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusOK, []models.User{})
		return
	}

	var users []models.User
	// Search by username username like %q%
	if err := db.DB.Where("username LIKE ?", "%"+query+"%").Limit(5).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	// Return minimal info
	var result []gin.H
	for _, u := range users {
		result = append(result, gin.H{
			"id":          u.ID,
			"username":    u.Username,
			"avatarColor": u.AvatarColor,
		})
	}

	c.JSON(http.StatusOK, result)
}
