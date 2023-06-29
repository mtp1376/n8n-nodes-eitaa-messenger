import { TLDeserialization, TLSerialization } from "./tl_utils.js";
import fetch from "node-fetch";

export class EitaaClient {
	constructor() {
	}

	async sendCode(phoneNumber) {
		const sendCodeInput = new TLSerialization({ mtproto: false })
		sendCodeInput.storeMethod(
			'auth.sendCode', {
				phone_number: phoneNumber,
				api_id: 94575,
				api_hash: 'a3406de8d171bb422bb6ddf3bbd800e2', // https://telegra.ph/telegraph-01-31-6
				settings: { flags: 0, _: 'codeSettings' }
			}
		)
		return await this.#wrapAndSendRequest(sendCodeInput);
	}

	async signIn(phoneNumber, code) {
		const signInInput = new TLSerialization({ mtproto: false });
		signInInput.storeMethod(
			'auth.signIn', {
				phone_number: phoneNumber,
				phone_code: code,
			}
		)
		const response = await this.#wrapAndSendRequest(signInInput);
		this.token = response.token;
		this.user = response.user;
		console.log(this.token);
		return response;
	}

	async getContacts() {
		const getContactsInput = new TLSerialization({ mtproto: false });
		getContactsInput.storeMethod(
			'contacts.getContacts',
			{}
		)
		return await this.#wrapAndSendRequest(getContactsInput);
	}

	async resolveUsername(username) {
		const resolveUsernameInput = new TLSerialization({ mtproto: false });
		resolveUsernameInput.storeMethod(
			'contacts.resolveUsername', { username }
		)
		return await this.#wrapAndSendRequest(resolveUsernameInput)
	}

	async getUsers(userIds) {
		const getUsersInput = new TLSerialization({ mtproto: false });
		getUsersInput.storeMethod(
			'users.getUsers', {
				id: userIds.map(id => ({
					_: 'inputUser',
					user_id: id
				}))
			}
		)
		return await this.#wrapAndSendRequest(getUsersInput, true)
	}

	async getChannels(channelIds) {
		const getChannelsInput = new TLSerialization({ mtproto: false });
		getChannelsInput.storeMethod(
			'channels.getChannels', {
				id: channelIds.map(id => ({
					_: 'inputChannel',
					channel_id: id
				}))
			}
		)
		return await this.#wrapAndSendRequest(getChannelsInput, false)
	}

	async importContacts(phones) {
		const importContactsInput = new TLSerialization({ mtproto: false });
		importContactsInput.storeMethod(
			'contacts.importContacts', {
				contacts: phones.map(p => ({
					_: 'inputPhoneContact',
					phone: p,
					first_name: p
				}))
			}
		)
		return await this.#wrapAndSendRequest(importContactsInput);
	}

	async deleteContacts(inputArray) {
		const deleteContactsInput = new TLSerialization({ mtproto: false });
		deleteContactsInput.storeMethod(
			'contacts.deleteContacts', {
				id: inputArray
			}
		)
		return await this.#wrapAndSendRequest(deleteContactsInput);
	}

	async getChannelParticipants(channelId, offset) {
		const getChannelParticipantsInput = new TLSerialization({ mtproto: false });
		getChannelParticipantsInput.storeMethod(
			'channels.getParticipants', {
				channel: {
					_: 'inputChannel',
					channel_id: channelId
				},
				filter: {
					_: 'channelParticipantsRecent',
				},
				limit: 100,
				offset
			}
		)
		return await this.#wrapAndSendRequest(getChannelParticipantsInput, false)
	}

	async refreshToken() {
		const refreshTokenInput = new TLSerialization({ mtproto: false });
		refreshTokenInput.storeMethod(
			'eitaaRefreshToken', {
				app_info: {
					_: 'eitaaAppInfo',
					build_version: 'v3.5',
					device_model: 'MamadBoot',
					system_version: 'v0.1',
					app_version: 'v0.1',
					lang_code: 'fa',
					sign: '',
				}
			}
		)
		const response = await this.#wrapAndSendRequest(refreshTokenInput)
		this.token = response.token;
		// console.log(this.token);
		return response;
	}

	async getFullChat(chatId) {
		// for groups
		const getFullChatInput = new TLSerialization({ mtproto: false });
		getFullChatInput.storeMethod(
			'messages.getFullChat', {
				chat_id: chatId
			}
		)
		return await this.#wrapAndSendRequest(getFullChatInput)
	}

	async getFullChannel(channelId) {
		// for channels
		const getFullChannelInput = new TLSerialization({ mtproto: false });
		getFullChannelInput.storeMethod(
			'channels.getFullChannel', {
				channel: {
					_: 'inputChannel',
					channel_id: channelId
				}
			}
		)
		return await this.#wrapAndSendRequest(getFullChannelInput)
	}

	async getHistory(chatId, type = 'chat') {
		let peer;
		switch (type) {
			case "chat":
				peer = { _: 'inputPeerChat', chat_id: chatId }
				break;
			case "channel":
				peer = { _: 'inputPeerChannel', channel_id: chatId }
				break;
		}
		const getHistoryInput = new TLSerialization({ mtproto: false });
		getHistoryInput.storeMethod(
			'messages.getHistory', {
				peer,
				// offset_id: 12312,
				offset_date: 0,
				add_offset: 0,
				limit: 1000,
				max_id: 0,
				min_id: 0,
				hash: '0'
			}
		)
		return await this.#wrapAndSendRequest(getHistoryInput)
	}

	async searchGlobal(query) {
		const searchGlobalInput = new TLSerialization({ mtproto: false });
		searchGlobalInput.storeMethod(
			'messages.searchGlobalExt', {
				q: query,
				flags: 262144,
				offset_date: 0,
				offset_peer: {
					_: 'inputPeerEmpty'
				},
				offset_id: 0,
				limit: 1000
			}
		)
		return await this.#wrapAndSendRequest(searchGlobalInput)
	}

	async editChannelTitle(channelId, newTitle) {
		const editChannelTitleInput = new TLSerialization({ mtproto: false });
		editChannelTitleInput.storeMethod(
			'channels.editTitle', {
				channel: {
					_: 'inputChannel',
					channel_id: channelId,
				},
				title: newTitle
			}
		)
		return await this.#wrapAndSendRequest(editChannelTitleInput)
	}

	async sendMessage(message) {
		const editChannelTitleInput = new TLSerialization({ mtproto: false });
		editChannelTitleInput.storeMethod(
			'messages.sendMessage', {
				peer: {
					_: 'inputPeerUser',
					user_id: '39119789', // our user
					access_hash: '59823066' // this is needed :)
				},
				message,
				flags: '8', // entities: flags.3?Vector<MessageEntity>
				entities: [{
					_: 'messageEntityMention', offset: 0, length: message.length,
					user_id: {
						_: 'inputUserEmpty',
						// user_id: '1009245',
						// access_hash: '-1074468499'
					}
				}],
				random_id: '1659990899450' + Math.floor(Math.random() * 10000)
			}
		)
		return await this.#wrapAndSendRequest(editChannelTitleInput)
	}

	async getDialogs(offsetDate) {
		const getDialogsInput = new TLSerialization({ mtproto: false });
		getDialogsInput.storeMethod(
			'messages.getDialogs', {
				pFlags: {},
				flags: 0,
				// folder_id: 0,
				offset_date: offsetDate,
				offset_id: 0,
				offset_peer: { _: 'inputPeerEmpty' },
				limit: 100,
				hash: '0',
			}
		)
		return await this.#wrapAndSendRequest(getDialogsInput);
	}

	#wrapRequest(packedData) {
		const eitaaObject = new TLSerialization({ mtproto: false })
		eitaaObject.storeMethod(
			"eitaaObject", {
				token: this.token || '',
				imei: 'zorrat_xmamad__ios',
				packed_data: packedData.getBytes(true),
				layer: 133
			});
		return eitaaObject;
	}

	async #wrapAndSendRequest(packedData, isVector = false) {
		const body = this.#wrapRequest(packedData);
		return this.#sendRequest(body, isVector);
	}

	async #sendRequest(body, isVector = false) {
		const response = await fetch('https://sajad.eitaa.ir/eitaa/', {
			method: 'POST', body: body.getBytes(true),
			// agent: proxyAgent
		});
		return this.#parseResponse(new Uint8Array(await response.arrayBuffer()), isVector ? 'Vector' : '');
	}

	#parseResponse(response, type = "") {
		const deserializer = new TLDeserialization(new Uint8Array(response), { mtproto: true })
		const eitaaObject = deserializer.fetchObject(type, "INPUT");
		if (eitaaObject.packed_data) {
			const packedDeserializer = new TLDeserialization(new Uint8Array(eitaaObject.packed_data), { mtproto: true })
			return packedDeserializer.fetchObject("", "INPUT");
		}
		return eitaaObject;
	}

	setToken(token) {
		this.token = token;
	}
}
