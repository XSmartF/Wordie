using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wordie.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudySessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ConsecutiveCorrect",
                table: "Words",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CorrectCount",
                table: "Words",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueAt",
                table: "Words",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "EaseFactor",
                table: "Words",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "IncorrectCount",
                table: "Words",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Interval",
                table: "Words",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Lapses",
                table: "Words",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LastRating",
                table: "Words",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReviewedAt",
                table: "Words",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSessionAt",
                table: "Words",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Repetition",
                table: "Words",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "StudySessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WordSetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Mode = table.Column<int>(type: "int", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequestedLimit = table.Column<int>(type: "int", nullable: false),
                    IncludeDue = table.Column<bool>(type: "bit", nullable: false),
                    IncludeNew = table.Column<bool>(type: "bit", nullable: false),
                    Shuffle = table.Column<bool>(type: "bit", nullable: false),
                    AllowFlip = table.Column<bool>(type: "bit", nullable: false),
                    AllowTyping = table.Column<bool>(type: "bit", nullable: false),
                    TotalCards = table.Column<int>(type: "int", nullable: false),
                    CompletedCards = table.Column<int>(type: "int", nullable: false),
                    CorrectAnswers = table.Column<int>(type: "int", nullable: false),
                    IncorrectAnswers = table.Column<int>(type: "int", nullable: false),
                    TotalTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudySessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudySessions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudySessions_WordSets_WordSetId",
                        column: x => x.WordSetId,
                        principalTable: "WordSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudyCardProgress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudySessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Prompt = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpectedAnswer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OptionsSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SelectedOptionsSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastAnswer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    LastRating = table.Column<int>(type: "int", nullable: true),
                    Attempts = table.Column<int>(type: "int", nullable: false),
                    CorrectAttempts = table.Column<int>(type: "int", nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    StepIndex = table.Column<int>(type: "int", nullable: false),
                    LastReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Accuracy = table.Column<decimal>(type: "decimal(6,2)", nullable: false),
                    ConsecutiveCorrect = table.Column<int>(type: "int", nullable: false),
                    TimeSpentSeconds = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudyCardProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudyCardProgress_StudySessions_StudySessionId",
                        column: x => x.StudySessionId,
                        principalTable: "StudySessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudyCardProgress_Words_WordId",
                        column: x => x.WordId,
                        principalTable: "Words",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudyCardProgress_StudySessionId",
                table: "StudyCardProgress",
                column: "StudySessionId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyCardProgress_WordId",
                table: "StudyCardProgress",
                column: "WordId");

            migrationBuilder.CreateIndex(
                name: "IX_StudySessions_UserId",
                table: "StudySessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudySessions_WordSetId",
                table: "StudySessions",
                column: "WordSetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudyCardProgress");

            migrationBuilder.DropTable(
                name: "StudySessions");

            migrationBuilder.DropColumn(
                name: "ConsecutiveCorrect",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "CorrectCount",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "DueAt",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "EaseFactor",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "IncorrectCount",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Interval",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Lapses",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "LastRating",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "LastReviewedAt",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "LastSessionAt",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Repetition",
                table: "Words");
        }
    }
}
