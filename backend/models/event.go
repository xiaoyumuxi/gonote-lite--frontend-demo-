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
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	UserID      string         `gorm:"index" json:"userId"` // Foreign Key to User (string ID)
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	
	// Date stored as standard UTC time. 
	// For Lunar events, this might represent the converted solar date for the *current* occurrence,
	// or the frontend handles the conversion logic based on the raw fields.
	Date        time.Time      `gorm:"not null" json:"date"`
	
	Type        EventType      `gorm:"type:string;default:'solar'" json:"type"`
	Recurrence  RecurrenceType `gorm:"type:string;default:'none'" json:"recurrence"`
	
	// JSON array of User IDs to notify
	NotifyUsers string         `gorm:"type:text" json:"notifyUsers"` 
	
	ShowCountdown bool         `gorm:"default:false" json:"showCountdown"`
	
	// System events are read-only for users (e.g., Holidays, Solar Terms)
	IsSystem    bool           `gorm:"default:false" json:"isSystem"`
}
