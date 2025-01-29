import { NetskopeClient } from '../mcp.js';

async function examples() {
  const mcp = new NetskopeClient({});

  try {
    // Publishers
    const publisherResult = await mcp.createPublisher({
      name: "web-publisher"
    });
    const publisher = JSON.parse(publisherResult.content[0].text).data;
    
    const updatedPublisherResult = await mcp.updatePublisher({
      id: publisher.id,
      name: "web-publisher-updated",
      lbrokerconnect: true
    });
    const publisherDetails = await mcp.getPublisher(publisher.id);
    const allPublishers = await mcp.listPublishers();
    const regToken = await mcp.generatePublisherRegistrationToken(publisher.id);

    // Local Brokers
    const brokerResult = await mcp.createLocalBroker({
      name: "edge-broker"
    });
    const broker = JSON.parse(brokerResult.content[0].text).data;
    
    const brokerDetails = await mcp.getLocalBroker(broker.id);
    await mcp.updateLocalBroker(broker.id, { name: "edge-broker-updated" });
    const allBrokers = await mcp.listLocalBrokers();
    const brokerConfig = await mcp.getLocalBrokerConfig();
    await mcp.updateLocalBrokerConfig({
      hostname: "edge.internal"
    });

    // Private Apps with different port formats
    
    // Single port example
    const webApp = await mcp.createPrivateApp(
      "internal-web",
      "web.internal",
      { type: 'tcp', port: "80" },
      "80"
    );

    // Port range example
    const apiApp = await mcp.createPrivateApp(
      "api-gateway",
      "api.internal",
      { type: 'tcp', port: "8000-8080" },
      "8000-8080"
    );

    // Multiple ports example
    const dbApp = await mcp.createPrivateApp(
      "database",
      "db.internal",
      { type: 'tcp', port: "3306,5432,27017" },
      "3306,5432,27017"
    );

    // Mixed format example
    const serviceApp = await mcp.createPrivateApp(
      "microservices",
      "services.internal",
      { type: 'tcp', port: "80,443,8000-8080,9000" },
      "80,443,8000-8080,9000"
    );

    // Policy Rules
    const rule = await mcp.createPolicyRule("allow-internal", "default-group");

    // Complex Workflow: Publisher with Scheduled Updates
    // 1. Create publisher
    const prodPublisherResult = await mcp.createPublisher({
      name: "prod-publisher"
    });
    const prodPublisher = JSON.parse(prodPublisherResult.content[0].text).data;
    
    // 2. Create upgrade profile with proper cron format
    // Format: minute hour day * DAY_OF_WEEK
    // Example: "0 0 * * SUN" for Sunday at midnight
    const upgradeProfileResult = await mcp.createUpgradeProfile({
      name: "weekend-beta-updates",
      enabled: true,
      docker_tag: "latest",
      frequency: "0 0 * * SUN", // Sunday at midnight
      timezone: "US/Pacific",
      release_type: "Beta"
    });
    const upgradeProfile = JSON.parse(upgradeProfileResult.content[0].text).data;

    // 3. Update upgrade profile with a different schedule
    // You can use human-readable format: "DAY HH:MM"
    await mcp.upgradeProfileSchedule({
      id: upgradeProfile.id,
      schedule: "SATURDAY 23:00" // Will be converted to "0 23 * * 6"
    });

    // 4. Link publisher to upgrade profile
    await mcp.updatePublisher({
      id: prodPublisher.id,
      name: prodPublisher.name,
      lbrokerconnect: true,
      publisher_upgrade_profiles_id: upgradeProfile.id
    });

    // 5. Create private app with the publisher
    const internalApp = await mcp.createPrivateApp(
      "crm-app",
      "crm.internal",
      { type: 'tcp', port: "443" },
      "443"
    );

    // 6. Create access policy
    await mcp.createPolicyRule("allow-crm", "prod-group");
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Example cron formats:
// "0 0 * * SUN" - Every Sunday at midnight
// "0 23 * * FRI" - Every Friday at 11 PM
// "30 2 * * MON" - Every Monday at 2:30 AM
// "0 0 * * MON,WED,FRI" - Every Monday, Wednesday, and Friday at midnight
