import { useState, useLayoutEffect } from 'react'
import twilio from 'twilio'
import { Client } from 'twilio-chat'
import { nanoid } from 'nanoid'
import firebase from 'firebase'

const AccessToken = twilio.jwt.AccessToken
const ChatGrant = AccessToken.ChatGrant
const credentials = require('./credentials.json')

// "serviceSid": "IS32cf689e9b9149289487f06ae4ad414c",
// "accountSid": "AC1954674cce150b1a83a27ee7bbbd2149",
// "signingKeySid": "SK463c96b9ee13412db0d59992884dd7c8",
// "signingKeySecret": "QHqObGkAxMy8dFJSmi59SWqa8MQh8iYr",
// "authToken": "18f80e428f2437dd4995588bb441e121"

// process.env.TWILIO_CHAT_SERVICE_SID
// process.env.TWILIO_ACCOUNT_SID
// process.env.TWILIO_AUTH_TOKEN
// process.env.TWILIO_API_KEY
// process.env.TWILIO_API_SECRET

// if (process.env.TWILIO_CHAT_SERVICE_SID !== undefined) {
// 	console.log('It is set!')
// } else {
// 	console.log('No set!')
// }

// var firebaseConfig = {
// 	apiKey: 'AIzaSyAmiJ0Y0isaXy-JoXOLlnMT6OY-SprGFgI',
// 	authDomain: 'twilio-push-notification-ca82c.firebaseapp.com',
// 	databaseURL: 'https://twilio-push-notification-ca82c.firebaseio.com',
// 	projectId: 'twilio-push-notification-ca82c',
// 	storageBucket: 'twilio-push-notification-ca82c.appspot.com',
// 	messagingSenderId: '582529668280',
// 	appId: '1:582529668280:web:5af52fb49880f9dbd3504d',
// 	measurementId: 'G-WJHJC149B6',
// }

var firebaseConfig = {}

if (!firebase.apps.length) {
	firebase.initializeApp(firebaseConfig)
	// firebase.analytics()
}

export function useTwilio({ identity, token }) {
	const [loadingTwilioClient, setLoadingTwilioClient] = useState(true)
	const [loadingTwilioChat, setLoadingTwilioChat] = useState(true)
	const [loadingTwilioMessages, setLoadingTwilioMessages] = useState(true)

	const [twilioClient, setTwilioClient] = useState(null)
	const [twilioChannel, setTwilioChannel] = useState(null)
	const [twilioUser, setTwilioUser] = useState(null)
	const [twilioPage, setTwilioPage] = useState(null)
	const [twilioMessages, setTwilioMessages] = useState(null)
	const [lastMessage, setLastMessage] = useState(null)
	const [typingUsers, setTypingUsers] = useState([])

	useLayoutEffect(() => {
		if (identity) {
			let accessToken

			if (token) {
				accessToken = token
			} else {
				const generatedToken = createToken(identity)
				accessToken = generatedToken
			}

			initTwilioClient(accessToken).then((client) => {
				setTwilioClient(client)
				subscribeClientEvent(client, identity)

				setTwilioUser(client.user)
				subscribeUserEvent(client.user)
				setLoadingTwilioClient(false)
			})
		}
		return () => {
			twilioClient && twilioClient.removeAllListeners()
		}
	}, [identity])

	useLayoutEffect(() => {
		// console.log('run when twilio Client change', twilioClient)
		if (twilioClient) {
			if (
				firebase &&
				firebase.messaging.isSupported() &&
				firebase.messaging()
			) {
				// requesting permission to use push notifications
				firebase
					.messaging()
					.requestPermission()
					.then(() => {
						// getting FCM token
						firebase
							.messaging()
							.getToken()
							.then((fcmToken) => {
								console.log(fcmToken)
								// continue with Step 7 here
								// ...
								// ...
								// passing FCM token to the `chatClientInstance` to register for push notifications
								twilioClient.setPushRegistrationId('fcm', fcmToken)

								// registering event listener on new message from firebase to pass it to the Chat SDK for parsing
								firebase.messaging().onMessage((payload) => {
									console.log('firebase.messaging.onMessage.payload', payload)

									document.title = 'newMessage'

									setTimeout(() => {
										document.title = 'React App'
									}, 3000)

									var title = payload.notification.title
									var body = payload.notification.body

									new Notification(title, {
										body,
										icon: 'https://i.imgur.com/Av6xcUg.png',
										// image: 'https://i.imgur.com/Av6xcUg.png', // browser not support
										// sound:
										// 	'https://notificationsounds.com/soundfiles/f29c21d4897f78948b91f03172341b7b/file-sounds-1155-got-it-done.mp3', // browser not support
										// timestamp: new Date(),
									})

									// payload.data.twi_message_type = 'web'
									// payload.data.twi_title = payload.notification.title
									// payload.data.twi_body = payload.notification.body

									/**
									 * Not working
									 */

									// twilioClient
									// 	.handlePushNotification(payload)
									// 	.then((res) => console.log(res))
									// 	.catch((error) => console.log(error))
								})
							})
							.catch((err) => {
								// can't get token
								console.log('firebase.messaging.onMessage.err', err.message)
							})
					})
					.catch((err) => {
						// can't request permission or permission hasn't been granted to the web app by the user
					})
			} else {
				// no Firebase library imported or Firebase library wasn't correctly initialized
			}
		}
	}, [twilioClient])

	useLayoutEffect(() => {
		// console.log('run when twilio Channel change', twilioChannel)
		if (twilioChannel) {
			getMessages()
			subscribeChannelEvent(twilioChannel)
		}
	}, [twilioChannel])

	useLayoutEffect(() => {
		// console.log('run when twilio Messages change', twilioMessages)
	}, [twilioMessages])

	/**
	 * Twilio service
	 */

	/**
	 * Factory method to create Access token instance.
	 *
	 * @param {String} identity - Identity
	 * @returns {String} token - Access token
	 */
	const createToken = (identity) => {
		const chatGrant = new ChatGrant({
			serviceSid: credentials.serviceSid,
			pushCredentialSid: credentials.pushCredentialSid,
		})

		const token = new AccessToken(
			credentials.accountSid,
			credentials.signingKeySid,
			credentials.signingKeySecret,
			{
				ttl: 60 * 60 * 24,
			}
		)

		token.addGrant(chatGrant)

		token.identity = identity

		return token.toJwt()
	}

	/**
	 * Factory method to create Access token instance.
	 *
	 * @param {String} identity - Identity
	 * @returns {Boolean} result - Result
	 */
	async function refreshToken(identity) {
		const token = await createToken(identity)
		twilioClient && twilioClient.updateToken(token)
		return true
	}

	/**
	 * Twilio client
	 */

	/**
	 * Factory method to create Twilio client instance.
	 *
	 * @param {String} token - Access token
	 * @returns {Promise<Client>} client - Twilio client
	 */
	const initTwilioClient = (token) => {
		// Initialize the Chat messaging client
		return new Promise((resolve, reject) => {
			Client.create(token)
				.then((client) => {
					resolve(client)
				})
				.catch((error) => reject(error))
		})
	}

	/**
	 * Factory method to create Twilio client instance.
	 *
	 * @param {String} channelId - ChannelId
	 * @returns {Promise<Channel>} channel - Channel
	 */
	const initTwilioChat = (channelId) => {
		// Initialize the Chat messaging client
		return new Promise((resolve, reject) => {
			if (!twilioClient) {
				reject('Twilio client not exist')
			}

			setLoadingTwilioChat(true)
			twilioClient
				.getChannelBySid(channelId)
				.then((channel) => {
					setTwilioChannel(channel)
					setLoadingTwilioChat(false)

					resolve(channel)
				})
				.catch((error) => reject(error))
		})
	}

	/**
	 * Factory method to create subscribe Twilio client instance.
	 *
	 * @param {Client} client - Twilio client
	 * @returns {void}
	 */
	const subscribeClientEvent = (client) => {
		client.on('tokenAboutToExpire', function () {
			// Implement fetchToken() to make a secure request to your backend to retrieve a refreshed access token.
			// Use an authentication mechanism to prevent token exposure to 3rd parties.
			// console.log('tokenAboutToExpire')
			!token && refreshToken(identity)
		})

		client.on('tokenExpired', function () {
			// Implement fetchToken() to make a secure request to your backend to retrieve a refreshed access token.
			// Use an authentication mechanism to prevent token exposure to 3rd parties.
			// console.log('tokenExpired')
		})

		/**
		 * channel event
		 */
		client.on('channelJoined', function (channel) {
			// console.log('Joined channel ' + channel.friendlyName)
		})
		client.on('channelInvited', function (channel) {
			// console.log('Invited to channel ' + channel.friendlyName)
			// Join the channel that you were invited to
		})
		client.on('channelAdded', function (channel) {
			// console.log('Channel added: ' + channel.friendlyName)
		})
		// A channel is no longer visible to the Client
		client.on('channelRemoved', function (channel) {
			// console.log('Channel removed: ' + channel.friendlyName)
		})
		// A channel's attributes or metadata have changed.
		client.on('channelUpdated', function (channel) {
			console.dir(channel)
			// console.log('Channel updates: ' + channel.sid)
		})
	}

	/**
	 * Factory method to create subscribe Twilio user instance.
	 *
	 * @param {User} user - Twilio user
	 * @returns {void}
	 */
	const subscribeUserEvent = (user) => {
		user.on('updated', function (event) {
			// Implement fetchToken() to make a secure request to your backend to retrieve a refreshed access token.
			// Use an authentication mechanism to prevent token exposure to 3rd parties.
			console.lg('updated')
			handleUserUpdate(event.user, event.updateReasons)
		})
	}

	/**
	 * Factory method to create subscribe Twilio channel instance.
	 *
	 * @param {Channel} channel - Twilio channel
	 * @returns {void}
	 */
	const subscribeChannelEvent = (channel) => {
		/**
		 * member event
		 */
		channel.on('memberJoined', function (member) {
			console.log(member.identity + ' has joined the channel.')
		})

		// Listen for members user info changing
		channel.on('memberInfoUpdated', function (member) {
			console.log(member.identity + ' updated their info.')
		})

		// Listen for members leaving a channel
		channel.on('memberLeft', function (member) {
			console.log(member.identity + ' has left the channel.')
		})
		// Listen for members typing
		channel.on('typingStarted', function (member) {
			// console.log(member.identity + ' is currently typing.')
			setTypingUsers((prevState) => {
				const setTypingUsers = new Set(prevState)
				return Array.from(setTypingUsers.add(member.identity))
			})
		})
		// Listen for members typing
		channel.on('typingEnded', function (member) {
			// console.log(member.identity + ' has stopped typing.')

			setTypingUsers((prevState) => {
				const filterTypingUsers = prevState.filter(
					(user) => user !== member.identity
				)

				return filterTypingUsers
			})
		})
		// this code assumes you have a variable names activeChannel for
		// the currently active channel in the UI
		channel.on('memberUpdated', function (event) {
			// note this method would use the provided information
			// to render this to the user in some way
			console.log(
				'memberUpdated',
				event,
				event.member.identity,
				event.member.lastConsumedMessageIndex,
				event.member.lastConsumptionTimestamp
			)
			const isOwner = identity === event.member.identity
			if (!isOwner) {
				// console.log(twilioMessages)

				setLastMessage((prevStateLastMessage) => {
					const setMembers = new Set(prevStateLastMessage?.members || [])

					return {
						index: event.member.lastConsumedMessageIndex,
						status: 'seen',
						members: [...setMembers.add(event.member.identity)],
						dateUpdated: event.member.lastConsumptionTimestamp,
					}
				})
			}
		})

		/**
		 * message event
		 */
		// Listen for new messages sent to a channel
		channel.on('messageAdded', async function (message) {
			// 	console.log(message, message.index, message.author, message.body)
			// console.log('messageAdded', message)

			const isOwner = identity === message.state.author

			setLastMessage({
				index: message.state.index,
				status: isOwner ? 'sent' : null,
				members: isOwner ? [] : null,
				dateUpdated: message.state.dateUpdated,
			})

			if (message.type === 'media') {
				// console.log('Message is media message')
				// log media properties
				// console.log('Media attributes', message.media)
				// get media temporary URL for displaying/fetching
				message.media.url = await message.media.getContentTemporaryUrl()
			}

			setTwilioMessages((prevState) => [...prevState, message])

			twilioChannel.updateLastConsumedMessageIndex(message.index)
		})
	}

	// function to handle User updates
	function handleUserUpdate(user, updateReasons) {
		// loop over each reason and check for reachability change
		updateReasons.forEach((reason) => {
			if (reason === 'online') {
				//do something
			}
		})
	}

	const publicChannels = async () => {
		return new Promise((resolve, reject) => {
			twilioClient &&
				twilioClient
					.getPublicChannelDescriptors()
					.then((channelDescriptorPage) => {
						// for (let i = 0; i < channelDescriptorPage.items.length; i++) {
						// const channel = channelDescriptorPage.items[i]
						// console.log('Channel: ' + channel.friendlyName)
						// }
						resolve(channelDescriptorPage.items)
					})
					.catch((error) => reject(error))
		})
	}

	const userChannels = async () => {
		return new Promise((resolve, reject) => {
			twilioClient &&
				twilioClient
					.getUserChannelDescriptors()
					.then(async (channelDescriptorPage) => {
						// for (let i = 0; i < channelDescriptorPage.items.length; i++) {
						// const channel = paginator.items[i]
						// console.log('Channel: ' + channel.friendlyName)
						// }

						await asyncForEach(
							channelDescriptorPage.items,
							async (descriptor) => {
								const channel = await descriptor.getChannel()
								if (channel) {
									const messagePage = await channel.getMessages(1)
									if (messagePage.items.length > 0) {
										// console.log(messagePage.items[0].state)
										const message = messagePage.items[0].state

										if (message.type === 'media') {
											// console.log('Message is media message')
											// log media properties
											// console.log('Media attributes', message.media)
											// get media temporary URL for displaying/fetching
											descriptor.lastMessage =
												message.author + ' sent an attachment.'
										} else {
											descriptor.lastMessage =
												messagePage.items[0].state.body ?? ''
										}
									}
									const unreadMessageCount = await channel.getUnconsumedMessagesCount()
									descriptor.unreadMessageCount = unreadMessageCount
								}
							}
						)

						resolve(channelDescriptorPage.items)
					})
					.catch((error) => reject(error))
		})
	}

	const subscribedChannels = async () => {
		return new Promise((resolve, reject) => {
			twilioClient &&
				twilioClient
					.getSubscribedChannels()
					.then((channelDescriptorPage) => {
						// for (let i = 0; i < channelDescriptorPage.items.length; i++) {
						// const channel = channelDescriptorPage.items[i]
						// console.log('Channel: ' + channel.friendlyName)
						// }
						resolve(channelDescriptorPage.items)
					})
					.catch((error) => reject(error))
		})
	}

	const localChannels = async () => {
		return new Promise((resolve, reject) => {
			twilioClient &&
				twilioClient
					.getLocalChannels()
					.then((items) => {
						// for (let i = 0; i < items.length; i++) {
						// const channel = items[i]
						// console.log('Channel: ' + channel.friendlyName)
						// }
						resolve(items)
					})
					.catch((error) => reject(error))
		})
	}

	const createChannel = async (friendlyName = 'General Chat Channel') => {
		return new Promise((resolve, reject) => {
			if (!twilioClient) {
				reject('Twilio client not exist')
			}

			twilioClient
				.createChannel({
					uniqueName: nanoid(),
					friendlyName,
				})
				.then(function (channel) {
					// console.log('Created general channel:')
					// console.log(channel)
					resolve(channel)
				})
				.catch((error) => reject(error))
		})
	}

	const deleteChannel = async (myChannel) => {
		return new Promise((resolve, reject) => {
			if (!myChannel) {
				reject('Twilio channel not exist')
			}

			myChannel
				.delete()
				.then(function (channel) {
					// console.log('Deleted channel: ' + channel.sid)
					resolve(channel.sid)
				})
				.catch((error) => reject(error))
		})
	}

	const inviteChannel = async (identity) => {
		return new Promise((resolve, reject) => {
			if (!twilioChannel) {
				reject('Twilio channel not exist')
			}

			twilioChannel
				.invite(identity)
				.then(function () {
					// console.log('Your friend has been invited!')
					resolve(true)
				})
				.catch((error) => reject(error))
		})
	}

	const joinChannel = async (myChannel) => {
		return new Promise((resolve, reject) => {
			if (!myChannel) {
				reject('Twilio channel not exist')
			}

			myChannel
				.join()
				.then((channel) => {
					// console.log('Joined to the channel', channel.friendlyName)
					resolve(true)
				})
				.catch(function (error) {
					// console.error(
					// 	"Couldn't join channel " +
					// 		myChannel.friendlyName +
					// 		' because ' +
					// 		error
					// )
					reject(error)
				})
		})
	}

	const leaveChannel = async () => {
		return new Promise((resolve, reject) => {
			if (!twilioChannel) {
				reject('Twilio channel not exist')
			}

			twilioChannel
				.leave()
				.then((channel) => {
					// console.log('Left to the channel', channel.friendlyName)
					resolve(true)
				})
				.catch(function (error) {
					// console.error(
					// 	"Couldn't leave channel " +
					// 		twilioChannel.friendlyName +
					// 		' because ' +
					// 		error
					// )
					reject(error)
				})
		})
	}

	const removeMember = async (identity) => {
		return new Promise((resolve, reject) => {
			if (!twilioChannel) {
				reject('Twilio channel not exist')
			}

			twilioChannel
				.removeMember(identity)
				.then(() => {
					// console.log('Your friend has been removed!')
					resolve(true)
				})
				.catch((error) => reject(error))
		})
	}

	const sendMessage = async (msg) => {
		return new Promise((resolve, reject) => {
			if (!twilioChannel) {
				reject('Twilio channel not exist')
			}

			twilioChannel
				.sendMessage(msg)
				.then(() => {
					// console.log('Message is sent!')
					resolve(true)
				})
				.catch((error) => reject(error))
		})
	}

	const sendMediaMessage = async (media, contentType = 'image/png') => {
		return new Promise((resolve, reject) => {
			if (!twilioChannel) {
				reject('Twilio channel not exist')
			}

			twilioChannel
				.sendMessage({
					contentType,
					media,
				})
				.then(() => {
					console.log('Media message is sent!')
					resolve(true)
				})
				.catch((error) => reject(error))
		})
	}

	const getMessages = async (
		pageSize = 2,
		anchor,
		direction = 'backwards' // 'forward' || 'backwards'
	) => {
		// console.log('getMessages')
		return new Promise((resolve, reject) => {
			if (!twilioChannel) {
				reject('Twilio channel not exist')
			}

			setLoadingTwilioMessages(true)
			twilioChannel
				.getMessages(pageSize, anchor, direction)
				.then(async (messagesPage) => {
					const totalMessages = messagesPage.items.length

					// console.log(messagesPage)
					setTwilioPage(messagesPage)

					if (messagesPage.items.length > 0) {
						var last_message_index =
							messagesPage.items[messagesPage.items.length - 1].index
						const result = await twilioChannel.updateLastConsumedMessageIndex(
							last_message_index
						)

						result && console.log('success')
					}

					// for (let i = 0; i < totalMessages; i++) {
					// 	const message = messagesPage.items[i]
					// 	console.log('Author:' + message.author)
					// }
					// console.log('Total Messages:' + totalMessages)

					await asyncForEach(messagesPage.items, async (message) => {
						if (message.type === 'media') {
							// console.log('Message is media message')
							// log media properties
							// console.log('Media attributes', message.media)
							// get media temporary URL for displaying/fetching
							message.media.url = await message.media.getContentTemporaryUrl()
						}
					})

					setTwilioMessages(messagesPage.items)

					setLoadingTwilioMessages(false)
					resolve(messagesPage)
				})
				.catch((error) => reject(error))
		})
	}

	async function prevPage() {
		// console.log('prevPage')
		if (twilioPage && twilioPage.hasPrevPage) {
			const prevPage = await twilioPage.prevPage()

			setTwilioPage(prevPage)

			const start = async () => {
				await asyncForEach(prevPage.items, async (message) => {
					if (message.type === 'media') {
						// console.log('Message is media message')
						// log media properties
						// console.log('Media attributes', message.media)
						// get media temporary URL for displaying/fetching
						message.media.url = await message.media.getContentTemporaryUrl()
					}
				})

				setTwilioMessages((prevState) => [...prevPage.items, ...prevState])
			}

			start()
		}
	}

	async function nextPage() {
		// console.log('nextPage')
		if (twilioPage && twilioPage.hasNextPage) {
			const nextPage = await twilioPage.nextPage()
			setTwilioPage(nextPage)

			const start = async () => {
				await asyncForEach(prevPage.items, async (message) => {
					if (message.type === 'media') {
						// console.log('Message is media message')
						// log media properties
						// console.log('Media attributes', message.media)
						// get media temporary URL for displaying/fetching
						message.media.url = await message.media.getContentTemporaryUrl()
					}
				})

				setTwilioMessages((prevState) => [...prevState, ...nextPage.items])
			}

			start()
		}
	}

	const typing = async () => {
		return new Promise((resolve, reject) => {
			if (!twilioChannel) {
				reject('Twilio channel not exist')
			}

			resolve(twilioChannel.typing())
		})
	}

	const markAllAsRead = async () => {
		// if (!twilioChannel) {
		// 	reject('Twilio channel not exist')
		// }

		return await twilioChannel.setAllMessagesConsumed()
	}

	const markAllAsUnread = async () => {
		// if (!twilioChannel) {
		// 	reject('Twilio channel not exist')
		// }

		return await twilioChannel.setNoMessagesConsumed()
	}

	/**
	 * Utils
	 */
	async function asyncForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array)
		}
	}

	return {
		loadingTwilioClient,
		loadingTwilioChat,
		loadingTwilioMessages,

		twilioClient,
		twilioUser,
		twilioChannel,
		twilioPage,
		twilioMessages,

		createToken,

		publicChannels,
		userChannels,
		subscribedChannels,
		localChannels,
		createChannel,
		deleteChannel,

		inviteChannel,
		joinChannel,
		leaveChannel,
		removeMember,

		sendMessage,
		sendMediaMessage,
		getMessages,
		prevPage,
		nextPage,
		typing,
		markAllAsRead,
		markAllAsUnread,

		initTwilioChat,
		lastMessage,
		typingUsers,
	}
}
