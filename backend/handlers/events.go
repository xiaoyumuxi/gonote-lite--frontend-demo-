package handlers

import (
	"gonote/db"
	"gonote/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetEvents - GET /api/events?start=...&end=...
// 返回用户自己的事件 + 家庭共享事件
func GetEvents(c *gin.Context) {
	userId := c.GetString("userId")
	start := c.Query("start")
	end := c.Query("end")
	familyOnly := c.Query("familyOnly") // 仅获取家庭事件

	// 获取用户信息，检查是否有家庭
	var user models.User
	db.DB.First(&user, "id = ?", userId)

	var events []models.Event

	if familyOnly == "true" && user.FamilyID != nil {
		// 仅返回家庭共享事件
		query := db.DB.Where("family_id = ?", *user.FamilyID)
		if start != "" && end != "" {
			query = query.Where("date BETWEEN ? AND ?", start, end)
		}
		query.Find(&events)
	} else {
		// 返回用户自己的事件 + 系统事件
		query := db.DB.Where("(user_id = ? AND (family_id IS NULL OR family_id = '')) OR is_system = ?", userId, true)
		if start != "" && end != "" {
			query = query.Where("date BETWEEN ? AND ?", start, end)
		}
		query.Find(&events)

		// 如果用户有家庭，也查询家庭共享事件
		if user.FamilyID != nil && familyOnly != "false" {
			var familyEvents []models.Event
			familyQuery := db.DB.Where("family_id = ?", *user.FamilyID)
			if start != "" && end != "" {
				familyQuery = familyQuery.Where("date BETWEEN ? AND ?", start, end)
			}
			familyQuery.Find(&familyEvents)
			events = append(events, familyEvents...)
		}
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
