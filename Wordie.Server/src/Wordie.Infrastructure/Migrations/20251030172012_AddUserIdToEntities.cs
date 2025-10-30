using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wordie.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "WordSets",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Words",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WordSets_UserId",
                table: "WordSets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Words_UserId",
                table: "Words",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Words_AspNetUsers_UserId",
                table: "Words",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WordSets_AspNetUsers_UserId",
                table: "WordSets",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Words_AspNetUsers_UserId",
                table: "Words");

            migrationBuilder.DropForeignKey(
                name: "FK_WordSets_AspNetUsers_UserId",
                table: "WordSets");

            migrationBuilder.DropIndex(
                name: "IX_WordSets_UserId",
                table: "WordSets");

            migrationBuilder.DropIndex(
                name: "IX_Words_UserId",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "WordSets");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Words");
        }
    }
}
