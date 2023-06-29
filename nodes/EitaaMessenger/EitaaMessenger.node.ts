import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-core';
import { EitaaClient } from "./lib/bot.js";

export class EitaaMessenger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EitaaMessenger',
		name: 'eitaaMessenger',
		icon: 'file:eitaa.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Eitaa Messenger API',
		defaults: {
			name: 'EitaaMessenger',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'eitaaMessengerApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Chat',
						value: 'chat'
					}
				],
				default: 'message',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send Document',
						value: 'sendDocument',
						description: 'Send a document',
						action: 'Send a document',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a text message',
						action: 'Send a text message',
					},
					{
						name: 'Send Photo',
						value: 'sendPhoto',
						description: 'Send a photo',
						action: 'Send a photo message',
					},
				],
				default: 'sendMessage',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Resolve Username',
						value: 'resolveUsername',
						description: 'Resolve a username, whether for user or channel',
						action: 'Resolve a username',
					},
					{
						name: 'Get Channel Participants',
						value: 'getChannelParticipants',
						description: 'Gets all participants in a channel, requires admin access',
						action: 'Get participants of a channel',
					},
				],
				default: 'resolveUsername',
			},

			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: 'mtp1376',
				displayOptions: {
					show: {
						operation: ['resolveUsername'],
						resource: ['chat'],
					},
				},
				required: true,
				description: 'Username of the channel or the user',
			},

			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendDocument', 'sendMessage', 'sendPhoto', 'getChannelParticipants'],
						resource: ['chat', 'message'],
					},
				},
				required: true,
				description: 'Unique identifier for the target chat',
			},

			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendDocument', 'sendPhoto'],
						resource: ['message'],
					},
				},
				placeholder: '',
				description: 'Name of the binary property that contains the data to upload',
			},

			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						resource: ['message'],
					},
				},
				description: 'Text of the message to be sent',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const credentials = await this.getCredentials('eitaaMessengerApi');
		const client = new EitaaClient();
		client.setToken(credentials.token);
		await client.refreshToken();

		for (let i = 0; i < items.length; i++) {
			if (operation === 'resolveUsername') {
				const username = this.getNodeParameter('username', i) as string;
				const res = (await client.resolveUsername(username));
				returnData.push({
					json: {
						...res,
					},
					binary: {},
					pairedItem: { item: i },
				});
			}

			if (operation === 'getChannelParticipants') {
				const channelId = this.getNodeParameter('chatId', i) as string;
				const CHUNK_SIZE = 100;
				let pageNo = 0;

				while (true) {
					const res = await client.getChannelParticipants(channelId, CHUNK_SIZE * pageNo);
					res.users.map((u: any) => {
						returnData.push({
							json: {
								...u,
							},
							binary: {},
							pairedItem: { item: i },
						});
					})

					if (res.count < CHUNK_SIZE) break;
					pageNo++;
				}
			}
		}

		return this.prepareOutputData(returnData);
	}
}
