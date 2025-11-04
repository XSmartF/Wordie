using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wordie.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsFavoriteToWordSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFavorite",
                table: "WordSets",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFavorite",
                table: "WordSets");
        }
    }
}
