import React, { useState, useLayoutEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
	Input,
	Button,
	useToast,
	Icon,
	Image,
	Stack,
	Box,
	Avatar,
	AvatarBadge,
	AvatarGroup,
} from '@chakra-ui/core'

import { useTwilio } from '../hooks/useTwilio'
import { Loading } from '../components'

export function Channel(props) {
	const identity = localStorage.getItem('username')

	const { id } = useParams()
	const navigate = useNavigate()
	const {
		loadingTwilioMessages,

		twilioClient,
		twilioChannel,
		twilioMessages,
		initTwilioChat,
		inviteChannel,
		leaveChannel,
		sendMessage,
		sendMediaMessage,
		prevPage,
		nextPage,
		typing,
		markAllAsRead,
		markAllAsUnread,
		lastMessage,
		typingUsers,
	} = useTwilio({
		identity,
	})
	const toast = useToast()

	const [message, setMessage] = useState('')
	const [messages, setMessages] = useState([])
	const [email, setEmail] = useState('development.account@urbanos.io')

	useLayoutEffect(() => {
		if (twilioClient) {
			initTwilioChat(id)
		}
	}, [twilioClient])

	useLayoutEffect(() => {
		if (twilioChannel) {
			console.log(twilioChannel)
			subscribeChannelEvent(twilioChannel)
		}

		return () => {
			twilioChannel && twilioChannel.removeAllListeners()
		}
	}, [twilioChannel])

	useLayoutEffect(() => {
		if (twilioMessages) {
			setMessages(twilioMessages)
		}
	}, [twilioMessages])

	function navigateList() {
		navigate('/channels')
	}

	async function handleLeave() {
		const result = await leaveChannel()
		result && navigateList()
	}

	/**
	 *  subscribe channel event
	 */
	const subscribeChannelEvent = (channel) => {
		/**
		 * member event
		 */
		channel.on('memberJoined', function (member) {
			// console.log(member.identity + ' has joined the channel.')
			toast({
				title: 'Member Joined.',
				description: member.identity + ' has joined the channel.',
				status: 'success',
				duration: 3000,
				isClosable: true,
			})
		})

		// Listen for members user info changing
		channel.on('memberInfoUpdated', function (member) {
			console.log(member.identity + ' updated their info.')
		})

		// Listen for members leaving a channel
		channel.on('memberLeft', function (member) {
			// console.log(member.identity + ' has left the channel.')
			toast({
				title: 'Member Left.',
				description: member.identity + ' has left the channel.',
				status: 'success',
				duration: 3000,
				isClosable: true,
			})
		})
		// Listen for members typing
		channel.on('typingStarted', function (member) {
			// console.log(member.identity + ' is currently typing.')
		})
		// Listen for members typing
		channel.on('typingEnded', function (member) {
			// console.log(member.identity + ' has stopped typing.')
		})
		// this code assumes you have a variable names activeChannel for
		// the currently active channel in the UI
		channel.on('memberUpdated', function (event) {
			// note this method would use the provided information
			// to render this to the user in some way
		})

		/**
		 * message event
		 */
		// Listen for new messages sent to a channel
		channel.on('messageAdded', async function (message) {
			// 	console.log(message, message.index, message.author, message.body)
		})
	}

	function handlePrevPage() {
		// console.log('prevPage')
		prevPage()
	}

	function handleNextPage() {
		// console.log('nextPage')
		nextPage()
	}

	function handleKeyDown(event) {
		if (event.keyCode === 13) {
			handleSendMessage()
		}
	}

	async function handleSendMessage() {
		const result = await sendMessage(message)
		result && setMessage('')
	}

	async function handleInvite() {
		// console.log('handleInvite')
		const result = await inviteChannel(email)
		result && console.log('success')
	}

	function handleTyping() {
		// console.log('handleTyping')
		typing()
	}

	async function handleMarkAllAsRead() {
		console.log('handleMarkAllAsRead')
		const result = await markAllAsRead()
		console.log(result)
		result && console.log('success')
	}

	async function handleMarkAllAsUnread() {
		console.log('handleMarkAllAsUnread')
		const result = await markAllAsUnread()
		result && console.log('success')
	}

	async function handleUploadImage(e) {
		// console.log('handleUploadImage')
		const result = await sendMediaMessage(e.target.files[0])
		result && console.log('success')
	}

	const renderTypingUsers = (users) => {
		if (users.length === 1) {
			return users.join(',') + ' is typing.'
		}

		if (users.length === 2) {
			return users.join(' and ') + ' are typing.'
		}

		if (users.length > 2) {
			return 'several people are typing'
		}

		return ''
	}

	const renderMessage = (message) => {
		// console.log(message.state.type === 'media' ? message.media : '')
		const isOwner = identity === message.state.author
		// console.log(message.state.index, lastMessage)
		return (
			<Box
				key={message.state.sid}
				shadow='xs'
				display='flex'
				justifyContent={!isOwner ? 'flex-start' : 'flex-end'}
				m={2}
			>
				<Box
					display='flex'
					rounded='md'
					bg={!isOwner ? '#E6FFFA' : '#81E6D9'}
					w={1 / 2}
					justifyContent={!isOwner ? 'flex-start' : 'flex-end'}
				>
					{!isOwner && (
						<Box p={2} mr={!isOwner ? 2 : 0} ml={!isOwner ? 0 : 2}>
							<Avatar
								name={message.state.author}
								src='https://bit.ly/broken-link'
							>
								<AvatarBadge size='1.25em' bg='green.500' />
							</Avatar>
						</Box>
					)}
					<Box p={2} mr={!isOwner ? 2 : 0} ml={!isOwner ? 0 : 2}>
						{message.state.type === 'media' ? (
							<Box
								display='flex'
								justifyContent={!isOwner ? 'flex-start' : 'flex-end'}
							>
								<Image
									size='100px'
									objectFit='cover'
									src={message.media.url}
									alt={message.media.sid}
									fallbackSrc='https://via.placeholder.com/100'
								/>
							</Box>
						) : (
							<Box
								mt='1'
								fontWeight='semibold'
								as='h4'
								lineHeight='tight'
								isTruncated
								display='flex'
								justifyContent={!isOwner ? 'flex-start' : 'flex-end'}
							>
								{message.state.body}
							</Box>
						)}
						<Box
							color='gray.600'
							fontSize='xs'
							display='flex'
							justifyContent={!isOwner ? 'flex-start' : 'flex-end'}
						>
							{message.dateUpdated.toLocaleString()}
						</Box>
						{lastMessage && lastMessage.index === message.state.index ? (
							<Box
								color='gray.600'
								fontSize='xs'
								display='flex'
								justifyContent={!isOwner ? 'flex-start' : 'flex-end'}
								alignItems='center'
							>
								<Box>
									{lastMessage.status === 'sent'
										? 'sent'
										: lastMessage.members?.find(
												(member) => member !== message.state.author
										  ) && lastMessage.status}
								</Box>
								<Box>
									<AvatarGroup size='sm' max={2}>
										{lastMessage.members
											?.filter((member) => member !== message.state.author)
											?.map((member, i) => (
												<Avatar key={i} name={member} />
											))}
									</AvatarGroup>
								</Box>
							</Box>
						) : null}
					</Box>
					<Box></Box>
				</Box>
			</Box>
		)
	}

	return (
		<div>
			{loadingTwilioMessages ? (
				<Loading />
			) : (
				<div>
					<Button onClick={navigateList} variantColor='teal' size='xs'>
						List
					</Button>
					Channel - {id}
					<Button onClick={handleLeave} variantColor='teal' size='xs'>
						Leave
					</Button>
					<Input
						placeholder='Email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<Button onClick={handleInvite} variantColor='teal' size='xs'>
						Invite
					</Button>
					<Input
						placeholder='something...'
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						onFocus={handleTyping}
					/>
					<Button onClick={handleSendMessage} variantColor='teal' size='xs'>
						Send
					</Button>
					<Button onClick={handlePrevPage} variantColor='teal' size='xs'>
						Prev
					</Button>
					<Button onClick={handleNextPage} variantColor='teal' size='xs'>
						Next
					</Button>
					<Button onClick={handleMarkAllAsRead} variantColor='teal' size='xs'>
						Mark all messages as read
					</Button>
					<Button onClick={handleMarkAllAsUnread} variantColor='teal' size='xs'>
						Mark all messages as unread
					</Button>
					<label>
						<input
							accept='image/*'
							multiple
							type='file'
							style={{
								display: 'none',
							}}
							onChange={(e) => handleUploadImage(e)}
						/>
						<Icon
							name='plus-square'
							size='20px'
							style={{
								display: 'inline-block',
								cursor: 'pointer',
							}}
						/>
					</label>
					<br />
					{renderTypingUsers(typingUsers)}
					<br />
					<Stack spacing={2}>
						{messages && messages.map((message) => renderMessage(message))}
					</Stack>
				</div>
			)}
		</div>
	)
}
