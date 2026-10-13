using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertWeb.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DropDocumentKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_document_kind",
                schema: "ref",
                table: "document");

            migrationBuilder.DropColumn(
                name: "kind",
                schema: "ref",
                table: "document");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "kind",
                schema: "ref",
                table: "document",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                schema: "ref",
                table: "document",
                keyColumn: "id",
                keyValue: 1,
                column: "kind",
                value: "указ");

            migrationBuilder.UpdateData(
                schema: "ref",
                table: "document",
                keyColumn: "id",
                keyValue: 2,
                column: "kind",
                value: "постановление");

            migrationBuilder.UpdateData(
                schema: "ref",
                table: "document",
                keyColumn: "id",
                keyValue: 3,
                column: "kind",
                value: "контрольный список");

            migrationBuilder.AddCheckConstraint(
                name: "ck_document_kind",
                schema: "ref",
                table: "document",
                sql: "kind in ('указ', 'постановление', 'контрольный список')");
        }
    }
}
