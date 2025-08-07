# LLM-Driven Test Plan for Netskope MCP Tools

This document provides a test plan designed to be executed by a Large Language Model (LLM). Each step is phrased as a natural language command. The goal is to verify that the LLM can correctly interpret these commands, invoke the appropriate MCP tool, and achieve the desired outcome.

**Instructions:** Execute the prompts in order. After creating a resource (e.g., a publisher or private app), take note of its name or ID as the LLM provides it, as you will need it for subsequent steps.

---

## 1. Foundational Validation

**Objective:** To ensure the LLM can use the validation tools to check data before creation.

- **Tool: `validateName`**
  - **Prompt 1:** "Check if 'My-First-Publisher' is a valid name for a publisher."
  - **Expected Outcome:** The LLM should state that the name is valid.
  - **Outcome:** The name 'My-First-Publisher' is valid for a publisher. The validation check returned successful with is_valid_name: true.
  - **Prompt 2:** "'docker-aws' a valid name for a private app?"
  - **Expected Outcome:** The LLM should state that the name is not valid and provide the reason.
  - **Outcome**: The name '[docker-aws]' is not valid for a private app because it already exists in the system. The validation tool returned an error message indicating that a private app with this name already exists.


- **Tool: `searchResources`**
  - **Prompt:** "Search for any publishers with 'prod' in their name."
  - **Expected Outcome:** The LLM should return a list of matching publishers or state that none were found.
  - **Outcome:** The search was successful but returned no results - there are no publishers whose names start with "prod".
  - **Prompt:** "Search for any publishers whose name starts with 'prod'"
  - **Expected Outcome:** The LLM should return a list of matching publishers or state that none were found.
  - **Outcome:** The search was successful but returned no results - there are no publishers whose names contain "prod".
---

## 2. Publisher and Upgrade Management

**Objective:** Test the complete lifecycle of creating, managing, and upgrading publishers.

- **Tool: `createPublisher`**
  - **Prompt:** "Create a new publisher and name it 'LLM-Test-Publisher-01'."
  - **Expected Outcome:** The LLM confirms the creation and provides the ID of the new publisher. **(Note this publisher's name and ID).**
  - **Outcome:**

- **Tool: `listPublishers` & `getPublisher`**
  - **Prompt:** "Show me all configured publishers, then get the details for the one named 'LLM-Test-Publisher-01'."
  - **Expected Outcome:** The LLM displays a list that includes the new publisher, then shows its detailed configuration.
  - **Outcome:** I've successfully listed all publishers. I can see there are 4 publishers configured:
    1. HOME (ID: 78)
    2. PIEHOUSE (ID: 94)
    3. AWS (ID: 98)
    4. LLM-Test-Publisher-01 (ID: 105)
    Details for 'LLM-Test-Publisher-01' (ID: 105):
      - __Name__: LLM-Test-Publisher-01
      - __ID__: 105
      - __Status__: not registered
      - __Common Name__: e483e3c25fcf2dc4
      - __Local Broker Connection__: false
      - __Upgrade Profile ID__: 1
      - __Registered__: false
      - __Apps Count__: 0
      - __Tags__: []
      - __Upgrade Status__: not_support
      - __Upgrade Request__: false
      This publisher appears to be a test publisher that is not currently registered and has no associated applications.


The user specifically wants details for 'LLM-Test-Publisher-01', which I already retrieved earlier (it's the one with ID 105). Let me get the detailed information for this publisher using the getPublisher tool.


- **Tool: `patchPublisher`**
  - **Prompt:** "Rename the publisher 'LLM-Test-Publisher-01' to 'LLM-Test-Publisher-Renamed'."
  - **Expected Outcome:** The LLM confirms the name change. **(Verify by asking: "Get the details for 'LLM-Test-Publisher-Renamed'.")**

- **Tool: `generatePublisherRegistrationToken`**
  - **Prompt:** "I need to register the publisher 'LLM-Test-Publisher-Renamed'. Can you generate a registration token for it?"
  - **Expected Outcome:** The LLM returns a string token.

- **Tool: `getReleases`**
  - **Prompt:** "What are the latest publisher software releases available?"
  - **Expected Outcome:** The LLM lists the available release versions (e.g., Latest, Beta).

- **Tool: `createUpgradeProfile`**
  - **Prompt:** "Create a new upgrade profile named 'LLM-Weekly-Updates'. It should target the 'Latest' release and run every Sunday at 2 AM UTC."
  - **Expected Outcome:** The LLM confirms creation and provides the profile ID. **(Note this profile's name and ID).**

- **Tool: `listUpgradeProfiles` & `updateUpgradeProfile`**
  - **Prompt:** "List all upgrade profiles, then change the 'LLM-Weekly-Updates' profile to target the 'Beta' release instead."
  - **Expected Outcome:** The LLM lists the profiles and then confirms the update. **(Verify by asking: "Show me the details for 'LLM-Weekly-Updates'.")**

- **Tool: `bulkUpgradePublishers`**
  - **Prompt:** "Immediately start an upgrade for the 'LLM-Test-Publisher-Renamed' publisher."
  - **Expected Outcome:** The LLM confirms that the upgrade request has been submitted.

---

## 3. Private Application and Traffic Steering

**Objective:** Test the creation of private apps and the steering of traffic to them.

- **Tool: `createPrivateApp`**
  - **Prompt:** "Define a new private application named 'LLM-Test-App' with the host 'intranet.test.local' on TCP port 8443. It should be served by the 'LLM-Test-Publisher-Renamed' publisher."
  - **Expected Outcome:** The LLM confirms the private app's creation. **(Note this app's name and ID).**

- **Tool: `listPrivateApps` & `getPrivateApp`**
  - **Prompt:** "List all my private apps, then show me the full configuration for 'LLM-Test-App'."
  - **Expected Outcome:** The LLM lists the apps, then shows the detailed configuration for the new app.

- **Tool: `updatePrivateApp`**
  - **Prompt:** "Update the 'LLM-Test-App' to also allow clientless access."
  - **Expected Outcome:** The LLM confirms the update. **(Verify by asking for the app's details again).**

- **Tool: `getPrivateAppTags` & `createPrivateAppTags`**
  - **Prompt:** "Show me the available private app tags, then tag the 'LLM-Test-App' as 'testing'."
  - **Expected Outcome:** The LLM lists tags and then confirms the tagging operation.

- **Tool: `updatePublisherAssociation`**
  - **Prompt:** "I need to add a backup publisher to the 'LLM-Test-App'. Find a publisher with 'backup' in its name and associate it with the app."
  - **Expected Outcome:** The LLM finds a suitable publisher and confirms the new association.

---

## 4. Policy and Access Control

**Objective:** Test the creation and management of ZTNA access policies.

- **Tool: `createRule`**
  - **Prompt:** "Create a new policy rule named 'Allow-Admin-Access-to-LLM-App'. It should allow access to the 'LLM-Test-App' for the 'Admins' user group. It should belong to the default policy group."
  - **Expected Outcome:** The LLM confirms the rule creation. **(Note this rule's name and ID).**

- **Tool: `listRules` & `getRule`**
  - **Prompt:** "List all policy rules, and then show me the details of the 'Allow-Admin-Access-to-LLM-App' rule."
  - **Expected Outcome:** The LLM lists the rules and then shows the detailed configuration of the new rule.

- **Tool: `updateRule`**
  - **Prompt:** "Disable the 'Allow-Admin-Access-to-LLM-App' policy rule for now."
  - **Expected Outcome:** The LLM confirms the rule has been disabled. **(Verify by asking for the rule's details again).**

- **Tool: `getPolicyInUse`**
  - **Prompt:** "Which policies are currently applied to the 'LLM-Test-App'?"
  - **Expected Outcome:** The LLM lists the policies affecting the application, including the one just created.

---

## 5. Local Broker Management

**Objective:** Test the tools for managing on-premises Local Brokers.

- **Tool: `createLocalBroker`**
  - **Prompt:** "I need to set up a new local broker for my datacenter. Please create one named 'LLM-Test-Broker'."
  - **Expected Outcome:** The LLM confirms the creation. **(Note this broker's name and ID).**

- **Tool: `listLocalBrokers` & `getLocalBroker`**
  - **Prompt:** "List all my local brokers, then get the details for 'LLM-Test-Broker'."
  - **Expected Outcome:** The LLM lists the brokers and then shows the details for the new one.

- **Tool: `updateLocalBroker`**
  - **Prompt:** "Rename the 'LLM-Test-Broker' to 'LLM-DC-Broker-01'."
  - **Expected Outcome:** The LLM confirms the name change.

- **Tool: `getBrokerConfig` & `updateBrokerConfig`**
  - **Prompt:** "What is the global hostname for my local brokers? Then, update it to 'broker.mycorp.local'."
  - **Expected Outcome:** The LLM first displays the current hostname, then confirms the update.

---

## 6. Diagnostics and Monitoring

**Objective:** Test the tools for troubleshooting and monitoring the environment.

- **Tool: `getUserDiagnostics`**
  - **Prompt:** "A user, 'test@example.com', is having trouble connecting. Can you run diagnostics for them?"
  - **Expected Outcome:** The LLM provides a diagnostics report for the user.

- **Tool: `getAlertConfig` & `updateAlertConfig`**
  - **Prompt:** "Who receives alerts for publisher events? Please add 'ops-team@example.com' to the list of notified admin users."
  - **Expected Outcome:** The LLM first shows the current configuration, then confirms the update.

---

## 7. System Cleanup

**Objective:** Return the environment to its original state by removing all test resources.

- **Prompt 1:** "Delete the policy rule named 'Allow-Admin-Access-to-LLM-App'."
- **Prompt 2:** "Now, delete the private application named 'LLM-Test-App'."
- **Prompt 3:** "Next, please remove the upgrade profile called 'LLM-Weekly-Updates'."
- **Prompt 4:** "Go ahead and delete the publisher named 'LLM-Test-Publisher-Renamed'."
- **Prompt 5:** "Finally, please delete the local broker named 'LLM-DC-Broker-01'."

**Expected Outcome for all cleanup prompts:** The LLM confirms the deletion of each resource sequentially.
