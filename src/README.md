# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities and see the participant list and open spots update without refreshing
- Unregister a participant with the trash icon next to their email

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Running backend tests

From the repository root, install the dependencies and run the pytest suite:

```sh
python -m pip install -r requirements.txt
python -m pytest -q tests
```

The tests use FastAPI's `TestClient` with isolated activity data, so you don't need to start the server.

## API Endpoints

| Method | Endpoint                                                             | Description                                                         |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                        | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu`      | Sign up for an activity                                             |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister from an activity; returns 404 if the activity or registration is not found |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
