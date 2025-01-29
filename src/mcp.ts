import * as commands from './commands/index.js';
import { LocalBrokerConfigPutRequest } from './types/schemas/local-broker.schemas.js';
import { UpgradeProfilePostRequest } from './types/schemas/upgrade-profiles.schemas.js';
import { PublisherPostRequest, PublisherPutRequest, PublisherPatchRequest } from './types/schemas/publisher.schemas.js';
import { AlertEventType } from './types/schemas/alerts.schemas.js';

interface MCPConfig {
  baseUrl?: string;
  apiKey?: string;
}

interface Protocol {
  type: 'tcp' | 'udp';
  port: string;
}

export class NetskopeClient {
  constructor(private config: MCPConfig) {}

  // Publishers
  async createPublisher(params: PublisherPostRequest) {
    return await commands.createPublisher(params);
  }

  async replacePublisher(params: PublisherPutRequest & { id: number }) {
    return await commands.replacePublisher(params);
  }

  async updatePublisher(params: PublisherPatchRequest & { id: number }) {
    return await commands.updatePublisher(params);
  }

  async getPublisher(id: number) {
    return await commands.getPublisher(id);
  }

  async listPublishers() {
    return await commands.listPublishers();
  }

  async generatePublisherRegistrationToken(publisherId: number) {
    return await commands.generatePublisherRegistrationToken(publisherId);
  }

  // Local Broker
  async createLocalBroker(params: { name: string }) {
    return await commands.createLocalBroker(params);
  }

  async updateLocalBroker(id: number, params: { name: string }) {
    return await commands.updateLocalBroker(id, params);
  }

  async deleteLocalBroker(id: number) {
    return await commands.deleteLocalBroker(id);
  }

  async getLocalBroker(id: number) {
    return await commands.getLocalBroker(id);
  }

  async listLocalBrokers() {
    return await commands.listLocalBrokers();
  }

  async getLocalBrokerConfig() {
    return await commands.getLocalBrokerConfig();
  }

  async updateLocalBrokerConfig(config: LocalBrokerConfigPutRequest) {
    return await commands.updateLocalBrokerConfig(config);
  }

  async generateLocalBrokerRegistrationToken(id: number) {
    return await commands.generateLocalBrokerRegistrationToken(id);
  }

  // Private Apps
  async createPrivateApp(name: string, host: string, protocol: Protocol, port: string | number) {
    return await commands.createPrivateApp(name, host, protocol, typeof port === 'number' ? port.toString() : port);
  }

  async updatePrivateApp(id: string, name: string, enabled: boolean = true) {
    return await commands.updatePrivateApp(id, name, enabled);
  }

  async listPrivateApps(options: { limit?: number; offset?: number; filter?: string; query?: string } = {}) {
    return await commands.listPrivateApps(options);
  }

  // Private App Tags
  async listPrivateAppTags(options: { query?: string; limit?: number; offset?: number } = {}) {
    return await commands.listPrivateAppTags(options);
  }

  async createPrivateAppTags(appId: string, tagNames: string[]) {
    return await commands.createPrivateAppTags(appId, tagNames);
  }

  async updatePrivateAppTags(appIds: string[], tagNames: string[]) {
    return await commands.updatePrivateAppTags(appIds, tagNames);
  }

  // Private App Publishers
  async updatePrivateAppPublishers(appIds: string[], publisherIds: string[]) {
    return await commands.updatePrivateAppPublishers(appIds, publisherIds);
  }

  async removePrivateAppPublishers(appIds: string[], publisherIds: string[]) {
    return await commands.removePrivateAppPublishers(appIds, publisherIds);
  }

  // Discovery Settings
  async getPrivateAppDiscoverySettings() {
    return await commands.getDiscoverySettings();
  }

  async getPrivateAppPolicyInUse(appIds: string[]) {
    return await commands.getPolicyInUse(appIds);
  }

  // Policy Rules
  async createPolicyRule(name: string, groupId: string) {
    return await commands.createPolicyRule(name, groupId);
  }

  async listPolicyRules(options: { limit?: number; sortby?: string; sortorder?: string } = {}) {
    return await commands.listPolicyRules(options);
  }

  // Upgrade Profiles
  async createUpgradeProfile(params: UpgradeProfilePostRequest) {
    return await commands.createUpgradeProfile(params);
  }

  async updateUpgradeProfile(params: UpgradeProfilePostRequest & { id: number }) {
    return await commands.updateUpgradeProfile(params);
  }

  async upgradeProfileSchedule(params: { id: number; schedule: string }) {
    return await commands.upgradeProfileSchedule(params);
  }

  async bulkUpgradePublishers(params: { publishers: { apply: { upgrade_request: boolean }, id: string[] } }) {
    return await commands.bulkUpgradePublishers(params);
  }

  // Alerts
  async getAlertConfig() {
    return await commands.getAlertConfig();
  }

  async updateAlertConfig(params: { adminUsers: string[]; eventTypes: AlertEventType[]; selectedUsers: string }) {
    return await commands.updateAlertConfig(params);
  }
}

export default NetskopeClient;
