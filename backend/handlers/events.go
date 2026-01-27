package handlers

import (
	"net/http"
	"gonote/db"
	"gonote/models"
	
	"github.com/gin-gonic/gin"
)

// GetEvents - GET /api/events?start=...&end=...
func GetEvents(c *gin.Context) {
	userId := c.GetString("userId") // Provided by Auth Middleware
	start := c.Query("start")
	end := c.Query("end")

	var events []models.Event
	query := db.DB.Where("(user_id = ? OR is_system = ?)", userId, true)

	if start != "" && end != "" {
		// Filter by date range (simplistic for now)
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
