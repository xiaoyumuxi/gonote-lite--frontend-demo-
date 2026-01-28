package handlers

import (
	"gonote/db"
	"gonote/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetEvents - GET /api/events?start=...&end=...
// 仅返回用户自己的事件 + 系统事件
// 家庭事件请通过 GetFamilyEvents 获取
func GetEvents(c *gin.Context) {
	userId := c.GetString("userId")
	start := c.Query("start")
	end := c.Query("end")

	var events []models.Event

	// 返回用户自己的事件 + 系统事件
	// 注意：家庭事件现在完全隔离
	query := db.DB.Where("(user_id = ? AND (family_id IS NULL OR family_id = '')) OR is_system = ?", userId, true)
	if start != "" && end != "" {
		query = query.Where("date BETWEEN ? AND ?", start, end)
	}

	if err := query.Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	c.JSON(http.StatusOK, events)
}

// CreateEvent - POST /api/events
func CreateEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Assign current user
	event.UserID = c.GetString("userId")

	if err := db.DB.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, event)
}

// DeleteEvent - DELETE /api/events/:id
func DeleteEvent(c *gin.Context) {
	id := c.Param("id")
	userId := c.GetString("userId")

	if err := db.DB.Where("id = ? AND user_id = ?", id, userId).Delete(&models.Event{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted"})
}
