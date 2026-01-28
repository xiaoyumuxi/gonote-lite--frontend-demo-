package main

import (
	"gonote/db"
	"gonote/handlers"
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

	// Simple Mock Auth Middleware
	// TODO: 生产环境应解析 JWT Token
	r.Use(func(c *gin.Context) {
		// 暂时使用固定用户 ID 进行测试
		c.Set("userId", "u-testfamily")
		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.Login)
		api.POST("/auth/register", handlers.Register)

		// 家庭相关
		api.POST("/family/create", handlers.CreateFamily)
		api.POST("/family/join", handlers.JoinFamily)
		api.POST("/family/leave", handlers.LeaveFamily)
		api.GET("/family/members", handlers.GetFamilyMembers)
		api.GET("/family/notes", handlers.GetFamilyNotes)

		api.GET("/events", handlers.GetEvents)
		api.POST("/events", handlers.CreateEvent)
		api.DELETE("/events/:id", handlers.DeleteEvent)

		api.GET("/notes", handlers.GetNotes)
		api.POST("/notes", handlers.CreateNote)
		api.PUT("/notes/:id", handlers.UpdateNote)
		api.DELETE("/notes/:id", handlers.DeleteNote)
	}

	log.Println("Server starting on :8080")
	r.Run(":8080")
}
