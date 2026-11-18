document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const addParticipantByActivity = new Map();

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Activity request failed (${response.status})`);
      }
      const activities = await response.json();

      activitiesList.replaceChildren();

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left"></span> spots left</p>
          <div class="participants-section">
            <strong>Current Participants:</strong>
            <ul class="participants-list" role="list"></ul>
            <p class="participants-empty">No participants yet.</p>
            <div class="participants-status" role="status"></div>
          </div>
        `;

        const participantsList = activityCard.querySelector(".participants-list");
        const emptyMessage = activityCard.querySelector(".participants-empty");
        const status = activityCard.querySelector(".participants-status");
        const spotsLeft = activityCard.querySelector(".spots-left");

        function updateAvailability() {
          spotsLeft.textContent = details.max_participants - participantsList.childElementCount;
          emptyMessage.hidden = participantsList.childElementCount > 0;
        }

        function addParticipant(email) {
          const row = document.createElement("li");
          const label = document.createElement("span");
          label.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.title = "Unregister participant";
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
            </svg>
          `;

          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            status.textContent = "";
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              if (!response.ok) {
                const result = await response.json();
                status.textContent = result.detail || "Failed to unregister. Please try again.";
                return;
              }

              row.remove();
              updateAvailability();
              status.textContent = `Unregistered ${email}.`;
            } catch (error) {
              status.textContent = "Failed to unregister. Please try again.";
              console.error("Error unregistering participant:", error);
            } finally {
              removeButton.disabled = false;
            }
          });

          row.append(label, removeButton);
          participantsList.appendChild(row);
          updateAvailability();
        }

        details.participants.forEach(addParticipant);
        updateAvailability();
        addParticipantByActivity.set(name, addParticipant);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Failed to load activities. Please try again later.";
      activitiesList.replaceChildren(errorMessage);
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        addParticipantByActivity.get(activity)(email);
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
