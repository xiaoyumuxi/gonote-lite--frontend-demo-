package handlers

import (
	"gonote/db"
	"gonote/models"
	"net/http"
	"time"

	"log"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateFamily - 创建新家庭
func CreateFamily(c *gin.Context) {
	userId := c.GetString("userId")
	log.Printf("DEBUG: CreateFamily request by UserID: %s", userId)

	var req struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供家庭名称"})
		return
	}

	// 生成家庭 ID
	familyId := "fam-" + uuid.New().String()[:8]

	// 创建家庭
	family := models.Family{
		ID:        familyId,
		Name:      req.Name,
		CreatorID: userId,
		CreatedAt: time.Now(),
	}
	if err := db.DB.Create(&family).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建家庭失败"})
		return
	}

	// 创建者自动成为成员（owner）
	member := models.FamilyMember{
		FamilyID: familyId,
		UserID:   userId,
		Role:     "owner",
		JoinedAt: time.Now(),
	}
	db.DB.Create(&member)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "家庭创建成功",
		"familyId": familyId,
		"family":   family,
	})
}

// JoinFamily - 加入家庭（可以加入多个）
func JoinFamily(c *gin.Context) {
	userId := c.GetString("userId")
	log.Printf("DEBUG: JoinFamily request by UserID: %s", userId)

	var req struct {
		FamilyID string `json:"familyId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供家庭编号"})
		return
	}

	// 检查家庭是否存在
	var family models.Family
	if err := db.DB.First(&family, "id = ?", req.FamilyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "家庭不存在，请检查编号"})
		return
	}

	// 检查是否已经是成员
	var existing models.FamilyMember
	if err := db.DB.Where("family_id = ? AND user_id = ?", req.FamilyID, userId).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "您已经是该家庭的成员"})
		return
	}

	// 加入家庭
	member := models.FamilyMember{
		FamilyID: req.FamilyID,
		UserID:   userId,
		Role:     "member",
		JoinedAt: time.Now(),
	}

	if err := db.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "加入家庭失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "成功加入家庭",
		"familyId": req.FamilyID,
		"family":   family,
	})
}

// LeaveFamily - 退出指定家庭
func LeaveFamily(c *gin.Context) {
	userId := c.GetString("userId")

	var req struct {
		FamilyID string `json:"familyId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请指定要退出的家庭编号"})
		return
	}

	// 检查是否是成员
	var member models.FamilyMember
	if err := db.DB.Where("family_id = ? AND user_id = ?", req.FamilyID, userId).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "您不是该家庭的成员"})
		return
	}

	// 删除成员关系
	db.DB.Delete(&member)

	// 检查家庭是否还有成员，如果没有则删除家庭
	var count int64
	db.DB.Model(&models.FamilyMember{}).Where("family_id = ?", req.FamilyID).Count(&count)
	if count == 0 {
		db.DB.Delete(&models.Family{}, "id = ?", req.FamilyID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "已退出家庭"})
}

// GetMyFamilies - 获取用户所有家庭
func GetMyFamilies(c *gin.Context) {
	userId := c.GetString("userId")
	log.Printf("DEBUG: GetMyFamilies request by UserID: %s", userId)

	var members []models.FamilyMember
	if err := db.DB.Preload("Family").Where("user_id = ?", userId).Find(&members).Error; err != nil {
		log.Printf("ERROR: GetMyFamilies DB Query Failed: %v", err)
	}
	log.Printf("DEBUG: GetMyFamilies Found %d members", len(members))

	// 提取家庭列表
	families := make([]gin.H, 0)
	for _, m := range members {
		families = append(families, gin.H{
			"id":        m.Family.ID,
			"name":      m.Family.Name,
			"role":      m.Role,
			"creatorId": m.Family.CreatorID,
			"joinedAt":  m.JoinedAt,
		})
	}

	c.JSON(http.StatusOK, families)
}

// GetFamilyMembers - 获取指定家庭的成员
func GetFamilyMembers(c *gin.Context) {
	userId := c.GetString("userId")
	familyId := c.Param("id")

	// 检查用户是否是该家庭成员
	var member models.FamilyMember
	if err := db.DB.Where("family_id = ? AND user_id = ?", familyId, userId).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "您不是该家庭的成员"})
		return
	}

	// 获取所有成员
	var members []models.FamilyMember
	db.DB.Preload("User").Where("family_id = ?", familyId).Find(&members)

	result := make([]gin.H, 0)
	for _, m := range members {
		result = append(result, gin.H{
			"userId":   m.UserID,
			"username": m.User.Username,
			"role":     m.Role,
			"joinedAt": m.JoinedAt,
		})
	}

	c.JSON(http.StatusOK, result)
}

// GetFamilyNotes - 获取指定家庭的共享笔记
func GetFamilyNotes(c *gin.Context) {
	userId := c.GetString("userId")
	familyId := c.Param("id")

	// 检查用户是否是该家庭成员
	var member models.FamilyMember
	if err := db.DB.Where("family_id = ? AND user_id = ?", familyId, userId).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "您不是该家庭的成员"})
		return
	}

	var notes []models.Note
	db.DB.Where("family_id = ?", familyId).Order("updated_at desc").Find(&notes)

	c.JSON(http.StatusOK, notes)
}

// GetFamilyEvents - 获取指定家庭的共享事件
func GetFamilyEvents(c *gin.Context) {
	userId := c.GetString("userId")
	familyId := c.Param("id")

	// 检查用户是否是该家庭成员
	var member models.FamilyMember
	if err := db.DB.Where("family_id = ? AND user_id = ?", familyId, userId).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "您不是该家庭的成员"})
		return
	}

	var events []models.Event
	db.DB.Where("family_id = ?", familyId).Order("date asc").Find(&events)

	c.JSON(http.StatusOK, events)
}
