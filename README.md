# booklist-website

A small web app for tracking books you've read, are currently reading, or want to read.

This project originally started as part of a much larger idea and was moved from an older account to this repository so it could be maintained more cleanly and publicly.

The project is still early in development and isn't production-ready yet. A few of the bigger issues that still need to be addressed:

## Current Issues / Future Improvements

### Security
The database queries are not properly sanitized yet. Right now the project is only intended for local/private use, but adding proper validation and parameterized queries would be one of the first priorities before deploying it publicly.

### User Support
The current database structure is built around a single shared dataset and doesn't support separate user accounts. Expanding it into a multi-user application would require restructuring the schema and adding authentication.

### Frontend / CSS
The CSS isn't fully responsive and some parts are more complicated than they need to be. It works, but it definitely needs cleanup and refactoring later on.

### Code Structure
Some parts of the backend rely on large multi-purpose functions and inefficient logic. Refactoring and breaking things into smaller modules is planned once the core features are finished.
