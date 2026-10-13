using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ExpertWeb.Api.Data;

public sealed class ExpertDbFactory : IDesignTimeDbContextFactory<ExpertDb>
{
    public ExpertDb CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__ExpertWeb");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Не задана переменная ConnectionStrings__ExpertWeb. В репозитории строки соединения нет.");
        }

        var options = new DbContextOptionsBuilder<ExpertDb>()
            .UseNpgsql(connectionString)
            .Options;
        return new ExpertDb(options);
    }
}
