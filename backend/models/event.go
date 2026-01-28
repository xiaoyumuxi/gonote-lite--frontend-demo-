package models

import (
	"time"

	"gorm.io/gorm"
)

type EventType string
type RecurrenceType string

const (
	EventTypeSolar   EventType = "solar"
	EventTypeLunar   EventType = "lunar"
	EventTypeHoliday EventType = "holiday" // Statutory holiday (e.g., National Day)
	EventTypeTerm    EventType = "term"    // Solar term (e.g., Winter Solstice)

	RecurrenceNone    RecurrenceType = "none"
	RecurrenceDaily   RecurrenceType = "daily"
	RecurrenceWeekly  RecurrenceType = "weekly"
	RecurrenceMonthly RecurrenceType = "monthly"
	RecurrenceYearly  RecurrenceType = "yearly"
)

type Event struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID      string  `gorm:"index" json:"userId"`
	FamilyID    *string `gorm:"index" json:"familyId"` // 家庭共享事件
	Title       string  `gorm:"not null" json:"title"`
	Description string  `json:"description"`

	// Date stored as standard UTC time.
	Date time.Time `gorm:"not null" json:"date"`

	Type       EventType      `gorm:"type:string;default:'solar'" json:"type"`
	Recurrence RecurrenceType `gorm:"type:string;default:'none'" json:"recurrence"`

	// JSON array of User IDs to notify
	NotifyUsers string `gorm:"type:text" json:"notifyUsers"`

	ShowCountdown bool `gorm:"default:false" json:"showCountdown"`

	// System events are read-only for users
	IsSystem bool `gorm:"default:false" json:"isSystem"`
}
