using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wordie.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWordMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefinitionVietnamese",
                table: "Words",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Example",
                table: "Words",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Words",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TypeOfWord",
                table: "Words",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefinitionVietnamese",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Example",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "TypeOfWord",
                table: "Words");
        }
    }
}
