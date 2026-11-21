RehabCare Appointment Setter

A course project: an ASP.NET MVC web app for managing appointments at a rehabilitation clinic.

Features

- Patient registration, login, profile, and record management
- Appointment booking and appointment updates
- Therapist and service management, including therapist schedules
- Payment status tracking and dashboard summaries

Tech stack

C#, ASP.NET MVC 5, .NET Framework 4.8, Entity Framework 6, MySQL, AngularJS, Bootstrap, and jQuery.

Run locally

1. Install Visual Studio with the ASP.NET and web development workload, the .NET Framework 4.8 Developer Pack, and MySQL Server.
2. Create a MySQL database named `rehabcare_db` and provision the tables mapped in `MachineProblem4/Models`. This repository does not include a database schema or seed script.
3. Update the `RehabCareDB` connection string in `MachineProblem4/Web.config` for your local MySQL credentials. Keep passwords out of source control.
4. Open `MachineProblem4.sln` in Visual Studio, restore NuGet packages, and run the project with IIS Express.
