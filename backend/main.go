package main

import (
	"gonote/db"
	"gonote/handlers"
	"gonote/middleware"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize DB
	db.Connect()

	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// JWT 认证中间件
	r.Use(middleware.JWTAuthMiddleware())

	api := r.Group("/api")
	{
		// 认证相关（无需 Token）
		api.POST("/auth/login", handlers.Login)
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/register/request", handlers.RegisterRequest)
		api.POST("/auth/register/verify", handlers.RegisterVerify)

		// 家庭相关
		api.POST("/family/create", handlers.CreateFamily)
		api.POST("/family/join", handlers.JoinFamily)
		api.POST("/family/leave", handlers.LeaveFamily)
		api.GET("/family/members", handlers.GetFamilyMembers)
		api.GET("/family/notes", handlers.GetFamilyNotes)
		api.GET("/family/events", handlers.GetFamilyEvents)

		// 事件相关
		api.GET("/events", handlers.GetEvents)
		api.POST("/events", handlers.CreateEvent)
		api.DELETE("/events/:id", handlers.DeleteEvent)

		// 笔记相关
		api.GET("/notes", handlers.GetNotes)
		api.POST("/notes", handlers.CreateNote)
		api.PUT("/notes/:id", handlers.UpdateNote)
		api.DELETE("/notes/:id", handlers.DeleteNote)
	}

	log.Println("Server starting on :8080")
	r.Run(":8080")
}
