# Netskope MCP Tools - Comprehensive Test Plan

This document outlines a systematic test plan to validate the functionality of each MCP tool. It is designed to be executed sequentially, as many tests depend on resources created in previous steps.

**Warning:** Execute this test plan in a dedicated, non-production environment.

## 1. ValidationTools

These tools are foundational for ensuring data integrity before it's sent to the API.

### `validateName`
- **Use Case:** Ensure resource names adhere to Netskope's naming conventions before creation.
- **Test 1: Valid Name**
  - **Action:** `validateName(resourceType='publisher', name='Valid-Publisher-Name-01')`
  - **Expected Result:** `{ "valid": true }`
- **Test 2: Invalid Name**
  - **Action:** `validateName(resourceType='private_app', name='Invalid App Name!')`
  - **Expected Result:** `{ "valid": false, "message": "Name contains invalid characters." }`

### `validateResource`
- **Use Case:** Pre-validate an entire resource configuration to catch errors before attempting creation.
- **Test 1: Valid Resource**
  - **Action:** `validateResource(resourceType='publisher', data={'name': 'Valid-Publisher-02'})`
  - **Expected Result:** `{ "valid": true }`
- **Test 2: Invalid Resource (Missing Fields)**
  - **Action:** `validateResource(resourceType='private_app', data={'host': '192.168.1.1'})`
  - **Expected Result:** `{ "valid": false, "errors": ["'app_name' is a required field."] }`

### `searchResources`
- **Use Case:** Find existing resources by name to avoid duplicates or to retrieve their IDs.
- **Test 1: Find Existing Resource**
  - **Action:** `searchResources(resourceType='publishers', query='ExistingPublisherName')`
  - **Expected Result:** A list containing the publisher(s) that match the query.
- **Test 2: Find Non-Existent Resource**
  - **Action:** `searchResources(resourceType='private_apps', query='NonExistentAppName')`
  - **Expected Result:** An empty list.

---

## 2. Publishers & Upgrade Profiles

This section tests the lifecycle of publishers and their upgrade configurations.

### `createPublisher`
- **Use Case:** Provision a new publisher in a specific location.
- **Test 1: Create a Publisher**
  - **Action:** `createPublisher(name='Test-Publisher-01')`
  - **Expected Result:** A new publisher object is returned with a unique `id`. **Note this ID for subsequent tests.**

### `listPublishers`
- **Use Case:** Get an inventory of all deployed publishers to check their status.
- **Test 1: List All Publishers**
  - **Action:** `listPublishers()`
  - **Expected Result:** A list of all publishers, including `Test-Publisher-01`.

### `getPublisher`
- **Use Case:** Retrieve detailed information about a specific publisher for troubleshooting.
- **Test 1: Get Publisher by ID**
  - **Action:** `getPublisher(id=[ID of Test-Publisher-01])`
  - **Expected Result:** Detailed object for `Test-Publisher-01`.

### `patchPublisher`
- **Use Case:** Update a specific attribute of a publisher, like its name or upgrade profile.
- **Test 1: Rename Publisher**
  - **Action:** `patchPublisher(id=[ID of Test-Publisher-01], name='Test-Publisher-01-Renamed')`
  - **Expected Result:** The publisher object is returned with the updated name.

### `updatePublisher`
- **Use Case:** Perform a full update of a publisher's configuration.
- **Test 1: Update Publisher Tags**
  - **Action:** `updatePublisher(id=[ID of Test-Publisher-01], name='Test-Publisher-01-Renamed', tags=[{'tag_name': 'region:us-east-1'}])`
  - **Expected Result:** The publisher object is returned with the new tag associated.

### `generatePublisherRegistrationToken`
- **Use Case:** Generate a token required to register a newly deployed publisher instance with the Netskope cloud.
- **Test 1: Generate Token**
  - **Action:** `generatePublisherRegistrationToken(publisherId=[ID of Test-Publisher-01])`
  - **Expected Result:** A registration token string is returned.

### `getReleases`
- **Use Case:** Check available publisher software versions to plan for upgrades.
- **Test 1: List Available Releases**
  - **Action:** `getReleases()`
  - **Expected Result:** A list of available releases (`Latest`, `Beta`, etc.) with their version numbers.

### `createUpgradeProfile`
- **Use Case:** Define a schedule for automatically upgrading a group of publishers.
- **Test 1: Create a Weekly Upgrade Profile**
  - **Action:** `createUpgradeProfile(name='Weekly-Upgrade-Profile', release_type='Latest', frequency='0 2 * * 0', timezone='UTC')`
  - **Expected Result:** A new upgrade profile object is returned. **Note the ID.**

### `listUpgradeProfiles`
- **Use Case:** Review all existing upgrade schedules.
- **Test 1: List All Profiles**
  - **Action:** `listUpgradeProfiles()`
  - **Expected Result:** A list including `Weekly-Upgrade-Profile`.

### `getUpgradeProfile`
- **Use Case:** Inspect the configuration of a specific upgrade schedule.
- **Test 1: Get Profile by ID**
  - **Action:** `getUpgradeProfile(id=[ID of Weekly-Upgrade-Profile])`
  - **Expected Result:** Detailed object for the profile.

### `updateUpgradeProfile`
- **Use Case:** Modify an existing upgrade schedule, for example, to change the target version or time.
- **Test 1: Change Schedule Time**
  - **Action:** `updateUpgradeProfile(id=[ID of Weekly-Upgrade-Profile], data={'frequency': '0 3 * * 0'})`
  - **Expected Result:** The profile is returned with the updated frequency.

### `bulkUpgradePublishers`
- **Use Case:** Manually trigger an immediate upgrade for one or more publishers.
- **Test 1: Trigger Upgrade**
  - **Action:** `bulkUpgradePublishers(publishers={'id': [[ID of Test-Publisher-01]], 'apply': {'upgrade_request': true}})`
  - **Expected Result:** A success status indicating the upgrade request was received.

---

## 3. Private Applications & Steering

This section tests the creation and management of private applications and how traffic is steered to them.

### `createPrivateApp`
- **Use Case:** Define a new internal application that users can access via ZTNA.
- **Test 1: Create a Web App**
  - **Action:** `createPrivateApp(app_name='Internal-Wiki', host='wiki.corp.local', protocols=[{'type': 'tcp', 'port': '443'}], publishers=[{'publisher_id': [ID of Test-Publisher-01]}])`
  - **Expected Result:** A new private app object is returned. **Note the ID.**

### `listPrivateApps`
- **Use Case:** Get an inventory of all configured private applications.
- **Test 1: List All Apps**
  - **Action:** `listPrivateApps()`
  - **Expected Result:** A list including `Internal-Wiki`.

### `getPrivateApp`
- **Use Case:** View the detailed configuration of a specific private app.
- **Test 1: Get App by ID**
  - **Action:** `getPrivateApp(id=[ID of Internal-Wiki])`
  - **Expected Result:** Detailed object for the app.

### `updatePrivateApp`
- **Use Case:** Modify the configuration of a private app, such as adding a new port.
- **Test 1: Add a Protocol**
  - **Action:** `updatePrivateApp(id=[ID of Internal-Wiki], protocols=[{'type': 'tcp', 'port': '443'}, {'type': 'tcp', 'port': '80'}])`
  - **Expected Result:** The app object is returned with the new protocol.

### `getPrivateAppTags`
- **Use Case:** List all available tags that can be used to categorize private apps.
- **Test 1: List All Tags**
  - **Action:** `getPrivateAppTags()`
  - **Expected Result:** A list of all private app tags.

### `createPrivateAppTags`
- **Use Case:** Assign a tag to a private app for easier policy creation and filtering.
- **Test 1: Tag an App**
  - **Action:** `createPrivateAppTags(id=[ID of Internal-Wiki], tags=[{'tag_name': 'documentation'}])`
  - **Expected Result:** Success status.

### `updatePrivateAppTags`
- **Use Case:** Bulk-update the tags for multiple applications at once.
- **Test 1: Bulk Update Tags**
  - **Action:** `updatePrivateAppTags(ids=[[ID of Internal-Wiki]], tags=[{'tag_name': 'critical'}])`
  - **Expected Result:** Success status.

### `updatePublisherAssociation` / `updatePrivateAppPublishers`
- **Use Case:** Change which publishers are responsible for providing access to an application.
- **Test 1: Add a Redundant Publisher**
  - **Action:** `updatePublisherAssociation(private_app_ids=[[ID of Internal-Wiki]], publisher_ids=[[ID of Test-Publisher-01], [ID of another publisher]])`
  - **Expected Result:** Success status.

### `deletePublisherAssociation` / `deletePrivateAppPublishers`
- **Use Case:** Remove a publisher from servicing an application, perhaps during decommissioning.
- **Test 1: Remove a Publisher**
  - **Action:** `deletePublisherAssociation(private_app_ids=[[ID of Internal-Wiki]], publisher_ids=[[ID of another publisher]])`
  - **Expected Result:** Success status.

### `getDiscoverySettings`
- **Use Case:** Review the configuration for automatic discovery of new private applications.
- **Test 1: Check Settings**
  - **Action:** `getDiscoverySettings()`
  - **Expected Result:** The current discovery settings object.

---

## 4. Policy & Access Control

This section tests the creation and management of access policies.

### `createRule`
- **Use Case:** Create a ZTNA policy rule to grant specific users access to an application.
- **Test 1: Allow Access Rule**
  - **Action:** `createRule(name='Allow-Dev-Access-to-Wiki', action='allow', policy_group_id=[ID of a policy group], conditions=[{'type': 'private_app', 'value': [ID of Internal-Wiki]}])`
  - **Expected Result:** A new rule object is returned. **Note the ID.**

### `listRules`
- **Use Case:** Audit all configured access policy rules.
- **Test 1: List All Rules**
  - **Action:** `listRules()`
  - **Expected Result:** A list of rules including the one just created.

### `getRule`
- **Use Case:** Inspect the details of a specific policy rule.
- **Test 1: Get Rule by ID**
  - **Action:** `getRule(id=[ID of the new rule])`
  - **Expected Result:** Detailed object for the rule.

### `updateRule`
- **Use Case:** Modify a rule, for example, to change it from 'allow' to 'block'.
- **Test 1: Disable a Rule**
  - **Action:** `updateRule(id=[ID of the new rule], data={'enabled': false})`
  - **Expected Result:** The rule object is returned with `enabled: false`.

### `getPolicyInUse`
- **Use Case:** Check which policies are currently applied to a specific private application.
- **Test 1: Check App's Policies**
  - **Action:** `getPolicyInUse(ids=[[ID of Internal-Wiki]])`
  - **Expected Result:** A list of policies affecting the application.

---

## 5. Diagnostics & Alerts

This section covers tools for troubleshooting and monitoring.

### `getUserDiagnostics`
- **Use Case:** Troubleshoot an end-user's connectivity issue to private apps.
- **Test 1: Check User Access**
  - **Action:** `getUserDiagnostics(userId='user@example.com')`
  - **Expected Result:** A diagnostics object showing the user's recent connection attempts.

### `getDeviceDiagnostics`
- **Use Case:** Investigate connectivity issues for a specific device.
- **Test 1: Check Device Access**
  - **Action:** `getDeviceDiagnostics(deviceId='[Device-ID]', privateAppId='[ID of Internal-Wiki]')`
  - **Expected Result:** A diagnostics object for that device and app.

### `getAlertConfig`
- **Use Case:** Review who gets notified about publisher-related events.
- **Test 1: Check Alert Recipients**
  - **Action:** `getAlertConfig()`
  - **Expected Result:** The current alert configuration, including admin users and event types.

### `updateAlertConfig`
- **Use Case:** Add a new administrator to receive notifications for publisher upgrades.
- **Test 1: Add Admin to Alerts**
  - **Action:** `updateAlertConfig(adminUsers=['admin1@example.com', 'newadmin@example.com'], eventTypes=['UPGRADE_SUCCEEDED', 'UPGRADE_FAILED'])`
  - **Expected Result:** The updated alert configuration object.

---

## 6. Local Broker Tools

This section tests the management of on-premises Local Brokers.

### `createLocalBroker`
- **Use Case:** Set up a new Local Broker for an on-premises data center.
- **Test 1: Create Broker**
  - **Action:** `createLocalBroker(name='On-Prem-Broker-01')`
  - **Expected Result:** A new local broker object. **Note the ID.**

### `listLocalBrokers`
- **Use Case:** Inventory all deployed Local Brokers.
- **Test 1: List All Brokers**
  - **Action:** `listLocalBrokers()`
  - **Expected Result:** A list including `On-Prem-Broker-01`.

### `getLocalBroker`
- **Use Case:** Check the status and configuration of a specific Local Broker.
- **Test 1: Get Broker by ID**
  - **Action:** `getLocalBroker(id=[ID of On-Prem-Broker-01])`
  - **Expected Result:** Detailed object for the broker.

### `updateLocalBroker`
- **Use Case:** Rename a Local Broker to match a new naming convention.
- **Test 1: Rename Broker**
  - **Action:** `updateLocalBroker(id=[ID of On-Prem-Broker-01], name='DC1-Broker-01')`
  - **Expected Result:** The broker object with the updated name.

### `generateLocalBrokerRegistrationToken`
- **Use Case:** Generate a token to register a new Local Broker instance.
- **Test 1: Generate Token**
  - **Action:** `generateLocalBrokerRegistrationToken(id=[ID of On-Prem-Broker-01])`
  - **Expected Result:** A registration token string.

### `getBrokerConfig`
- **Use Case:** Review the global hostname configuration for all Local Brokers.
- **Test 1: Get Global Config**
  - **Action:** `getBrokerConfig()`
  - **Expected Result:** The global broker configuration object.

### `updateBrokerConfig`
- **Use Case:** Update the global hostname for all Local Brokers.
- **Test 1: Update Hostname**
  - **Action:** `updateBrokerConfig(hostname='broker.corp.local')`
  - **Expected Result:** The updated global configuration.

---

## 7. Cleanup

This final section ensures the test environment is returned to its original state.

### `deleteRule`
- **Use Case:** Remove the test policy rule.
- **Test 1: Delete Test Rule**
  - **Action:** `deleteRule(id=[ID of the test rule])`
  - **Expected Result:** Success status.

### `deletePrivateApp`
- **Use Case:** Remove the test private application.
- **Test 1: Delete Test App**
  - **Action:** `deletePrivateApp(id=[ID of Internal-Wiki])`
  - **Expected Result:** Success status.

### `deleteUpgradeProfile`
- **Use Case:** Remove the test upgrade profile.
- **Test 1: Delete Test Profile**
  - **Action:** `deleteUpgradeProfile(id=[ID of Weekly-Upgrade-Profile])`
  - **Expected Result:** Success status.

### `deletePublisher`
- **Use Case:** Decommission the test publisher.
- **Test 1: Delete Test Publisher**
  - **Action:** `deletePublisher(id=[ID of Test-Publisher-01])`
  - **Expected Result:** Success status.

### `deleteLocalBroker`
- **Use Case:** Decommission the test Local Broker.
- **Test 1: Delete Test Broker**
  - **Action:** `deleteLocalBroker(id=[ID of On-Prem-Broker-01])`
  - **Expected Result:** Success status.
