using ExpertWeb.Api.Catalog;
using Microsoft.EntityFrameworkCore;

namespace ExpertWeb.Api.Data;

public sealed class ExpertDb(DbContextOptions<ExpertDb> options) : DbContext(options)
{
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Tnved> TnvedNodes => Set<Tnved>();
    public DbSet<NormativeDocument> Documents => Set<NormativeDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("ref");

        modelBuilder.Entity<Country>(entity =>
        {
            entity.ToTable("country");
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.IsoCode).HasColumnName("iso_code").HasMaxLength(3).IsRequired();
            entity.Property(item => item.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.HasIndex(item => item.IsoCode).IsUnique();
        });

        modelBuilder.Entity<Unit>(entity =>
        {
            entity.ToTable("unit");
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Code).HasColumnName("code").HasMaxLength(16).IsRequired();
            entity.Property(item => item.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.HasIndex(item => item.Code).IsUnique();
        });

        modelBuilder.Entity<Tnved>(entity =>
        {
            entity.ToTable("tnved");
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Code).HasColumnName("code").HasMaxLength(10).IsRequired();
            entity.Property(item => item.Name).HasColumnName("name").HasMaxLength(500).IsRequired();
            entity.Property(item => item.ParentId).HasColumnName("parent_id");
            entity.HasIndex(item => item.Code).IsUnique();
            entity.HasOne(item => item.Parent)
                .WithMany()
                .HasForeignKey(item => item.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<NormativeDocument>(entity =>
        {
            entity.ToTable("document", table => table.HasCheckConstraint(
                "ck_document_kind",
                "kind in ('указ', 'постановление', 'контрольный список')"));
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Kind).HasColumnName("kind").HasMaxLength(32).IsRequired();
            entity.Property(item => item.Code).HasColumnName("code").HasMaxLength(64).IsRequired();
            entity.Property(item => item.Title).HasColumnName("title").HasMaxLength(500).IsRequired();
            entity.Property(item => item.AdoptedOn).HasColumnName("adopted_on");
            entity.Property(item => item.EffectiveFrom).HasColumnName("effective_from");
            entity.Property(item => item.EffectiveTo).HasColumnName("effective_to");
            entity.HasIndex(item => item.Code).IsUnique();
        });

        modelBuilder.Entity<DocumentTnved>(entity =>
        {
            entity.ToTable("document_tnved");
            entity.HasKey(item => new { item.DocumentId, item.TnvedId });
            entity.Property(item => item.DocumentId).HasColumnName("document_id");
            entity.Property(item => item.TnvedId).HasColumnName("tnved_id");
            entity.HasOne<NormativeDocument>()
                .WithMany(item => item.TnvedLinks)
                .HasForeignKey(item => item.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Tnved>()
                .WithMany()
                .HasForeignKey(item => item.TnvedId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DocumentCountry>(entity =>
        {
            entity.ToTable("document_country");
            entity.HasKey(item => new { item.DocumentId, item.CountryId });
            entity.Property(item => item.DocumentId).HasColumnName("document_id");
            entity.Property(item => item.CountryId).HasColumnName("country_id");
            entity.HasOne<NormativeDocument>()
                .WithMany(item => item.CountryLinks)
                .HasForeignKey(item => item.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Country>()
                .WithMany()
                .HasForeignKey(item => item.CountryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        SampleCatalog.Apply(modelBuilder);
    }
}
