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
  - **Outcome:** I've successfully created the publisher LLM-Test-Publisher-01 with ID 105.

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

- **Tool: `patchPublisher`**
  - **Prompt:** "Rename the publisher 'LLM-Test-Publisher-01' to 'LLM-Test-Publisher-Renamed'."
  - **Expected Outcome:** The LLM confirms the name change. **(Verify by asking: "Get the details for 'LLM-Test-Publisher-Renamed'.")**
  - **Outcome:** I've successfully renamed the publisher. The response shows that the publisher with ID 105 now has the name "LLM-Test-Publisher-Renamed". Let me verify this by listing all publishers again to confirm the change. The rename operation was completed successfully. 

- **Tool: `generatePublisherRegistrationToken`**
  - **Prompt:** "I need to register the publisher 'LLM-Test-Publisher-Renamed'. Can you generate a registration token for it?"
  - **Expected Outcome:** The LLM returns a string token.
  - **Outcome:** I've successfully generated a registration token for the publisher 'LLM-Test-Publisher-Renamed' (ID: 105). Registration Token: _N8qaYAhePR7UKhyytUcs0yWdeEUKIsVVnNO8-0vBHBlDlyrKHT5g This JWT token can be used to register the publisher. The token contains the necessary information for the publisher to authenticate and register with the Netskope platform.


- **Tool: `getReleases`**
  - **Prompt:** "What are the latest publisher software releases available?"
  - **Expected Outcome:** The LLM lists the available release versions (e.g., Latest, Beta).
  - **Outcome:** Here are the latest publisher software releases available: Available Publisher Releases:
    1. __Beta__
      - Version: 128.0.0.9858
      - Docker Tag: 9858
    2. __Latest__
      - Version: 128.0.0.9857
      - Docker Tag: 9857
    3. __Latest-1__
      - Version: 126.0.0.9487
      - Docker Tag: 9487
    4. __Latest-2__
      - Version: 125.0.0.9474
      - Docker Tag: 9474

    The latest stable release is version 128.0.0.9857, while the beta version is slightly newer at 128.0.0.9858. The Latest-1 and Latest-2 releases represent previous stable versions that are one and two versions back from the current latest, respectively.


- **Tool: `createUpgradeProfile`**
  - **Prompt:** "Create a new upgrade profile named 'LLM-Weekly-Updates'. It should target the 'Latest' release and run every Sunday at 2 AM UTC."
  - **Expected Outcome:** The LLM confirms creation and provides the profile ID. **(Note this profile's name and ID).**
  - **Corrected Implementation:** The cron frequency format should be `"0 2 * * SUN"` where:
    - `0` = minute (2:00, not 2:01)
    - `2` = hour (2 AM in 24-hour format) 
    - `*` = day of month (every day)
    - `*` = month (every month)
    - `SUN` = day of week (Sunday - must be uppercase)
  - **Additional Parameters Required:**
    ```json
    {
      "name": "LLM-Weekly-Updates",
      "enabled": true,
      "docker_tag": "latest", 
      "frequency": "0 2 * * SUN",
      "timezone": "US/Eastern",
      "release_type": "Latest"
    }
    ```
  - **Outcome:** Great! I've successfully created the upgrade profile. Let me verify it by listing all upgrade profiles to confirm it was created correctly.

- **Tool: `listUpgradeProfiles` & `updateUpgradeProfile`**
  - **Prompt:** "List all upgrade profiles, then change the 'LLM-Weekly-Updates' profile to target the 'Beta' release instead."
  - **Expected Outcome:** The LLM lists the profiles and then confirms the update. **(Verify by asking: "Show me the details for 'LLM-Weekly-Updates'.")**
  - **Important:** When updating profiles, use the `external_id` from the list response (not the internal database `id`). For example, if the response shows `"id": 3, "external_id": 5`, use `5` for update operations.
  - **Schema Fix Applied:** Updated the schema to clarify that the `id` parameter should be the `external_id`, and the API requires this ID both in the URL path and request body.
  - **Outcome:** I can see all upgrade profiles listed. The 'LLM-Weekly-Updates' profile is there with ID 3 (internal database ID) and external_id 5 (API ID). It currently targets the 'Latest' release with docker_tag "9857". The update was successful. I can see that the 'LLM-Weekly-Updates' profile has been updated to target the 'Latest-1' release (N-1).


- **Tool: `bulkUpgradePublishers`**
  - **Prompt:** "Immediately start an upgrade for the 'LLM-Test-Publisher-Renamed' publisher."
  - **Expected Outcome:** The LLM confirms that the upgrade request has been submitted.
  - **Outcome:** I've successfully initiated the upgrade for the 'LLM-Test-Publisher-Renamed' publisher. The response shows that the upgrade request has been set to true for publisher ID 105.

---

## 3. Private Application and Traffic Steering

**Objective:** Test the creation of private apps and the steering of traffic to them.

- **Tool: `createPrivateApp`**
  - **Prompt:** "Define a new private application named 'LLM-Test-App' with the host 'intranet.test.local' on TCP port 8443. It should be served by the 'LLM-Test-Publisher-Renamed' publisher."
  - **Expected Outcome:** The LLM confirms the private app's creation. **(Note this app's name and ID).**
  - **Outcome:** Great! I've successfully created the private application. And can validate all settings by fetching the specific app settings.


- **Tool: `listPrivateApps` & `getPrivateApp`**
  - **Prompt:** "List all my private apps, then show me the full configuration for 'LLM-Test-App'."
  - **Expected Outcome:** The LLM lists the apps, then shows the detailed configuration for the new app.
  - **Outcome:** I've successfully listed all private apps and shown the full configuration for 'LLM-Test-App' (ID: 361). The app is configured with host 'intranet.test.local' on TCP port 8443, served by the 'LLM-Test-Publisher-Renamed' publisher (ID: 105). The app currently has no policies or tags assigned and is not reachable.

- **Tool: `updatePrivateApp`**
  - **Prompt:** "Update the 'LLM-Test-App' to also allow clientless access."
  - **Expected Outcome:** The LLM confirms the update. **(Verify by asking for the app's details again).**
  - **Outcome:** I've successfully updated the 'LLM-Test-App' (ID: 361) to enable clientless access. The app configuration now shows `clientless_access: true` instead of the previous `false` value. The modification was confirmed by retrieving the app details again after the update.

- **Tool: `getPrivateAppTags` & `createPrivateAppTags`**
  - **Prompt:** "Show me the available private app tags, then tag the 'LLM-Test-App' as 'testing'."
  - **Expected Outcome:** The LLM lists tags and then confirms the tagging operation.
  - **Outcome:** I've successfully listed the available private app tags (automation, database, management, tools, etc.) and tagged the 'LLM-Test-App' (ID: 361) with the 'testing' tag. The operation was confirmed with the response showing the app now has the tag with ID 49 and name 'testing'.

- **Tool: `updatePublisherAssociation`**
  - **Prompt:** "I need to add a backup publisher to the 'LLM-Test-App'. Find a publisher with 'backup' in its name and associate it with the app."
  - **Expected Outcome:** The LLM finds a suitable publisher and confirms the new association.
  - **Outcome:** I found the backup publisher "LLM-Backup-Publisher" (ID: 109) and successfully used the `updatePublisherAssociation` tool to associate it with the 'LLM-Test-App' (ID: 361). The tool now uses the correct API endpoint `/api/v2/steering/apps/private/publishers` with PUT method to replace publisher associations. The app now has both the original publisher (105) and the backup publisher (109) associated with it.

---

## 4. Policy and Access Control

**Objective:** Test the creation and management of ZTNA access policies.

- **Tool: `createRule`**
  - **Prompt:** "Create a new policy rule named 'Allow-Admin-Access-to-LLM-App'. It should allow access to the 'LLM-Test-App' for the 'Admins' user group. It should belong to the default policy group."
  - **Expected Outcome:** The LLM confirms the rule creation. **(Note this rule's name and ID).**
  - **Implementation Notes:**
    - **Private App Reference**: Use the app ID (361) rather than name for `private_app_ids: ["361"]`
    - **User Groups**: Use SCIM display names like `"Network Administrators"` rather than UUIDs
    - **Available Groups**: "Developers", "Executives", "Network Administrators", "financial-contractor", "netskope-all"
    - **Corrected Parameters**:
      ```json
      {
        "name": "Allow-Admin-Access-to-LLM-App",
        "description": "Allow Network Administrators access to LLM-Test-App",
        "enabled": true,
        "action": "allow", 
        "policy_group_id": 7,
        "private_app_ids": ["361"],
        "user_groups": ["Network Administrators"],
        "access_methods": ["Client", "Clientless"]
      }
      ```

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
