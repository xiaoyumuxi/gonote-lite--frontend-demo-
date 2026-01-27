package handlers

import (
	"net/http"
	"gonote/db"
	"gonote/models"
	
	"github.com/gin-gonic/gin"
)

// GetNotes - GET /api/notes?folderId=...
func GetNotes(c *gin.Context) {
	userId := c.GetString("userId")
	folderId := c.Query("folderId")
	search := c.Query("search")

	var notes []models.Note
	query := db.DB.Where("user_id = ?", userId)
	
	if folderId != "" {
		query = query.Where("folder_id = ?", folderId)
	}
	
	if search != "" {
		query = query.Where("title LIKE ? OR content LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	
	query.Order("updated_at desc").Find(&notes)
	c.JSON(http.StatusOK, notes)
}

// CreateNote - POST /api/notes
func CreateNote(c *gin.Context) {
	var note models.Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	note.UserID = c.GetString("userId")
	// Ensure ID is set (if not provided by frontend)
	if note.ID == "" {
		// In real app, use UUID lib. For now, assume frontend sends ID or simple fallback
		note.ID = "n-" + note.Title // simplified
	}

	if err := db.DB.Create(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}
	c.JSON(http.StatusCreated, note)
}

// UpdateNote - PUT /api/notes/:id
func UpdateNote(c *gin.Context) {
	id := c.Param("id")
	userId := c.GetString("userId")
	
	var note models.Note
	if err := db.DB.Where("id = ? AND user_id = ?", id, userId).First(&note).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}
	
	var updateData models.Note
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Update fields
	note.Title = updateData.Title
	note.Content = updateData.Content
	note.UpdatedAt = updateData.UpdatedAt // Sync time from frontend or use database time
	
	db.DB.Save(&note)
	c.JSON(http.StatusOK, note)
}

// DeleteNote - DELETE /api/notes/:id
func DeleteNote(c *gin.Context) {
	id := c.Param("id")
	userId := c.GetString("userId")
	
	if err := db.DB.Where("id = ? AND user_id = ?", id, userId).Delete(&models.Note{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted"})
}
