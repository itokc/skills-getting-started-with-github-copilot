from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setattr(
        app_module,
        "activities",
        {
            "Chess Club": {
                "description": "Play chess",
                "schedule": "Fridays",
                "max_participants": 12,
                "participants": [],
            }
        },
    )
    with TestClient(app_module.app) as test_client:
        yield test_client


def test_list_activities(client: TestClient):
    # Arrange
    expected = {
        "Chess Club": {
            "description": "Play chess",
            "schedule": "Fridays",
            "max_participants": 12,
            "participants": [],
        }
    }

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == expected


def test_signup_adds_participant(client: TestClient):
    # Arrange
    email = "student+club@example.com"

    # Act
    response = client.post("/activities/Chess%20Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}
    assert client.get("/activities").json()["Chess Club"]["participants"] == [email]


def test_duplicate_signup_does_not_add_participant(client: TestClient):
    # Arrange
    email = "student@example.com"
    app_module.activities["Chess Club"]["participants"].append(email)

    # Act
    response = client.post("/activities/Chess%20Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}
    assert client.get("/activities").json()["Chess Club"]["participants"] == [email]


def test_signup_for_unknown_activity(client: TestClient):
    # Arrange
    email = "student@example.com"

    # Act
    response = client.post("/activities/Unknown%20Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_unregister_removes_only_the_requested_registration(client: TestClient):
    # Arrange
    email = "student+club@example.com"
    other_email = "another@example.com"
    chess = app_module.activities["Chess Club"]
    chess["participants"].extend([email, other_email])
    app_module.activities["Art Club"] = {**chess, "participants": [email]}

    # Act
    response = client.delete("/activities/Chess%20Club/unregister", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from Chess Club"}
    current = client.get("/activities").json()
    assert current["Chess Club"]["participants"] == [other_email]
    assert current["Art Club"]["participants"] == [email]


@pytest.mark.parametrize(
    ("activity", "expected_detail"),
    [
        ("Unknown%20Club", "Activity not found"),
        ("Chess%20Club", "Student is not signed up for this activity"),
    ],
)
def test_unregister_requires_existing_registration(
    client: TestClient, activity: str, expected_detail: str
):
    # Arrange
    email = "student@example.com"

    # Act
    response = client.delete(f"/activities/{activity}/unregister", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": expected_detail}
