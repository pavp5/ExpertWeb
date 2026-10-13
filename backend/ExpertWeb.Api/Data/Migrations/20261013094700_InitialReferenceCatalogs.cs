using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertWeb.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialReferenceCatalogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "ref");

            migrationBuilder.CreateTable(
                name: "country",
                schema: "ref",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    iso_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "document",
                schema: "ref",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    adopted_on = table.Column<DateOnly>(type: "date", nullable: false),
                    effective_from = table.Column<DateOnly>(type: "date", nullable: false),
                    effective_to = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document", x => x.id);
                    table.CheckConstraint("ck_document_kind", "kind in ('указ', 'постановление', 'контрольный список')");
                });

            migrationBuilder.CreateTable(
                name: "tnved",
                schema: "ref",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    parent_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tnved", x => x.id);
                    table.ForeignKey(
                        name: "FK_tnved_tnved_parent_id",
                        column: x => x.parent_id,
                        principalSchema: "ref",
                        principalTable: "tnved",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "unit",
                schema: "ref",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unit", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "document_country",
                schema: "ref",
                columns: table => new
                {
                    document_id = table.Column<int>(type: "integer", nullable: false),
                    country_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_country", x => new { x.document_id, x.country_id });
                    table.ForeignKey(
                        name: "FK_document_country_country_country_id",
                        column: x => x.country_id,
                        principalSchema: "ref",
                        principalTable: "country",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_document_country_document_document_id",
                        column: x => x.document_id,
                        principalSchema: "ref",
                        principalTable: "document",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "document_tnved",
                schema: "ref",
                columns: table => new
                {
                    document_id = table.Column<int>(type: "integer", nullable: false),
                    tnved_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_tnved", x => new { x.document_id, x.tnved_id });
                    table.ForeignKey(
                        name: "FK_document_tnved_document_document_id",
                        column: x => x.document_id,
                        principalSchema: "ref",
                        principalTable: "document",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_document_tnved_tnved_tnved_id",
                        column: x => x.tnved_id,
                        principalSchema: "ref",
                        principalTable: "tnved",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "country",
                columns: new[] { "id", "iso_code", "name" },
                values: new object[,]
                {
                    { 1, "RU", "Образец: Россия" },
                    { 2, "KZ", "Образец: Казахстан" },
                    { 3, "DE", "Образец: Германия" }
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "document",
                columns: new[] { "id", "adopted_on", "code", "effective_from", "effective_to", "kind", "title" },
                values: new object[,]
                {
                    { 1, new DateOnly(2020, 1, 15), "ОБР-УКАЗ-1", new DateOnly(2020, 2, 1), null, "указ", "Образец указа" },
                    { 2, new DateOnly(2021, 6, 1), "ОБР-ПОСТ-1", new DateOnly(2021, 7, 1), new DateOnly(2024, 12, 31), "постановление", "Образец постановления" },
                    { 3, new DateOnly(2019, 3, 10), "ОБР-КС-1", new DateOnly(2019, 4, 1), null, "контрольный список", "Образец контрольного списка" }
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "tnved",
                columns: new[] { "id", "code", "name", "parent_id" },
                values: new object[,]
                {
                    { 1, "84", "Образец: машины и оборудование", null },
                    { 4, "85", "Образец: электрические машины", null }
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "unit",
                columns: new[] { "id", "code", "name" },
                values: new object[,]
                {
                    { 1, "шт", "Образец: штука" },
                    { 2, "кг", "Образец: килограмм" }
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "document_country",
                columns: new[] { "country_id", "document_id" },
                values: new object[,]
                {
                    { 2, 1 },
                    { 3, 2 },
                    { 1, 3 },
                    { 2, 3 }
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "tnved",
                columns: new[] { "id", "code", "name", "parent_id" },
                values: new object[,]
                {
                    { 2, "8413", "Образец: насосы", 1 },
                    { 5, "8542", "Образец: интегральные схемы", 4 }
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "document_tnved",
                columns: new[] { "document_id", "tnved_id" },
                values: new object[,]
                {
                    { 3, 2 },
                    { 3, 5 }
                });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "tnved",
                columns: new[] { "id", "code", "name", "parent_id" },
                values: new object[] { 3, "841370", "Образец: насосы центробежные", 2 });

            migrationBuilder.InsertData(
                schema: "ref",
                table: "document_tnved",
                columns: new[] { "document_id", "tnved_id" },
                values: new object[] { 1, 3 });

            migrationBuilder.CreateIndex(
                name: "IX_country_iso_code",
                schema: "ref",
                table: "country",
                column: "iso_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_document_code",
                schema: "ref",
                table: "document",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_document_country_country_id",
                schema: "ref",
                table: "document_country",
                column: "country_id");

            migrationBuilder.CreateIndex(
                name: "IX_document_tnved_tnved_id",
                schema: "ref",
                table: "document_tnved",
                column: "tnved_id");

            migrationBuilder.CreateIndex(
                name: "IX_tnved_code",
                schema: "ref",
                table: "tnved",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tnved_parent_id",
                schema: "ref",
                table: "tnved",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "IX_unit_code",
                schema: "ref",
                table: "unit",
                column: "code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "document_country",
                schema: "ref");

            migrationBuilder.DropTable(
                name: "document_tnved",
                schema: "ref");

            migrationBuilder.DropTable(
                name: "unit",
                schema: "ref");

            migrationBuilder.DropTable(
                name: "country",
                schema: "ref");

            migrationBuilder.DropTable(
                name: "document",
                schema: "ref");

            migrationBuilder.DropTable(
                name: "tnved",
                schema: "ref");
        }
    }
}
