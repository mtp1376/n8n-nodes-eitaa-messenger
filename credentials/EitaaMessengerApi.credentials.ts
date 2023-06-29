import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class EitaaMessengerApi implements ICredentialType {
	name = 'eitaaMessengerApi';
	displayName = 'EitaaMessenger API';
	documentationUrl = 'https://web.eitaa.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			placeholder: 'Token you get after signing into Eitaa',
			description: 'To get a token, you need to do some heavyliftings, contact me at the moment',
		},
	];
}
