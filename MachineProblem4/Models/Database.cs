using System;
using System.Configuration;
using MySql.Data.MySqlClient;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MachineProblem4.Models
{
    public class Database
    {
        private static string connectionString =
           ConfigurationManager.ConnectionStrings["RehabCareDB"].ConnectionString;

        public static MySqlConnection GetConnection()
        {
            return new MySqlConnection(connectionString);
        }
    }
}