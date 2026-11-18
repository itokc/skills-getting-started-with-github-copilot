from copy import deepcopy
from unittest import TestCase
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.app import activities, app


class UnregisterTests(TestCase):
    def setUp(self):
        state = patch("src.app.activities", deepcopy(activities))
        state.start()
        self.addCleanup(state.stop)
        self.client = self.enterContext(TestClient(app))
        self.email = "student+club@mergington.edu"

    def test_removes_only_the_requested_registration(self):
        for activity in ("Chess Club", "Art Club"):
            response = self.client.post(f"/activities/{activity}/signup", params={"email": self.email})
            self.assertEqual(response.status_code, 200)

        response = self.client.delete("/activities/Chess Club/unregister", params={"email": self.email})
        self.assertEqual(response.status_code, 200)

        current = self.client.get("/activities").json()
        self.assertEqual(current["Chess Club"]["participants"], activities["Chess Club"]["participants"])
        self.assertIn(self.email, current["Art Club"]["participants"])

    def test_missing_activity_and_registration_return_not_found(self):
        for activity, detail in (
            ("Unknown Club", "Activity not found"),
            ("Chess Club", "Student is not signed up for this activity"),
        ):
            with self.subTest(activity=activity):
                response = self.client.delete(f"/activities/{activity}/unregister", params={"email": self.email})
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json(), {"detail": detail})
