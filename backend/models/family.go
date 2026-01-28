package models

import (
	"time"
)

// Family 家庭（群组）
type Family struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	CreatorID string    `gorm:"index" json:"creatorId"`
	CreatedAt time.Time `json:"createdAt"`
}

// FamilyMember 家庭成员关联表（多对多）
type FamilyMember struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	FamilyID string    `gorm:"index;not null" json:"familyId"`
	UserID   string    `gorm:"index;not null" json:"userId"`
	Role     string    `gorm:"default:'member'" json:"role"` // "owner" or "member"
	JoinedAt time.Time `json:"joinedAt"`

	// 关联
	Family Family `gorm:"foreignKey:FamilyID" json:"family,omitempty"`
	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
