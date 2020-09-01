import React, { useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	Button,
	Accordion,
	AccordionItem,
	AccordionHeader,
	Box,
	AccordionIcon,
	AccordionPanel,
	useToast,
} from '@chakra-ui/core'

import { useTwilio } from '../hooks/useTwilio'
import { Loading } from '../components/Loading'

export function ChannelsIndex() {
	const identity = localStorage.getItem('username')

	let navigate = useNavigate()
	const {
		twilioClient,

		publicChannels,
		userChannels,
		subscribedChannels,
		localChannels,
		joinChannel,
		deleteChannel,
	} = useTwilio({ identity })
	const toast = useToast()

	const [loading, setLoading] = useState(false)
	const [pChannels, setPChannels] = useState([])
	const [uChannels, setUChannels] = useState([])
	const [sChannels, setSChannels] = useState([])
	const [lChannels, setLChannels] = useState([])

	useLayoutEffect(() => {
		setLoading(true)
		fetchChannels()

		if (twilioClient) {
			subscribeClientEvent(twilioClient)
		}

		return () => {
			twilioClient && twilioClient.removeAllListeners()
		}
	}, [twilioClient])

	useLayoutEffect(() => {
		if (twilioClient) {
			subscribeClientEvent(twilioClient)
		}
	})

	const subscribeClientEvent = (client) => {
		client.on('channelJoined', function (channel) {
			// console.log('Joined channel ' + channel.friendlyName)
		})
		client.on('channelInvited', async function (channel) {
			// console.log('Invited to channel ' + channel.friendlyName)
			// Join the channel that you were invited to
			try {
				const result = await channel.join()
				if (result && channel && loading) {
					toast({
						title: 'Channel invited.',
						description: 'Invited to channel ' + channel.friendlyName,
						status: 'success',
						duration: 1000,
						isClosable: true,
					})

					fetchChannels()
				}
			} catch (error) {
				console.log(error)
			}
		})
		client.on('channelAdded', function (channel) {
			// console.log('Channel added: ' + channel.friendlyName)
		})
		// A channel is no longer visible to the Client
		client.on('channelRemoved', function (channel) {
			// console.log('Channel removed: ' + channel.friendlyName)
			channel && fetchChannels()
		})
		// A channel's attributes or metadata have changed.
		client.on('channelUpdated', function (channel) {
			// console.log('Channel updates: ' + channel.sid)
			channel && fetchChannels()
		})
	}

	async function fetchChannels() {
		const pChannels = await publicChannels()
		const uChannels = await userChannels()
		const sChannels = await subscribedChannels()
		const lChannels = await localChannels()

		setPChannels(pChannels)
		setUChannels(uChannels)
		setSChannels(sChannels)
		setLChannels(lChannels)

		setLoading(false)
	}

	function navigateCreate() {
		navigate('/channels/create')
	}

	async function handleJoinChannel(channel) {
		try {
			const result = await joinChannel(channel)
			result && navigate(`/channels/${channel.sid}`)
		} catch (error) {
			if (error.message === 'Member already exists') {
				navigate(`/channels/${channel.sid}`)
			}
		}
	}

	async function handleDeleteChannel(channel) {
		setLoading(true)
		try {
			const result = await deleteChannel(channel)

			if (result) {
				fetchChannels()

				toast({
					title: 'Channel deleted.',
					description: 'Deleted channel successfully',
					status: 'success',
					duration: 1000,
					isClosable: true,
				})
			}
		} catch (error) {
			setLoading(false)

			toast({
				title: 'Channel deleted.',
				description: error,
				status: 'error',
				duration: 1000,
				isClosable: true,
			})
		}
	}

	const renderChannels = (descriptor) => {
		return (
			<div key={descriptor.sid}>
				{descriptor.createdBy === identity && (
					<Button
						onClick={async () => {
							const channel = await descriptor.getChannel()
							handleDeleteChannel(channel)
						}}
						variantColor='teal'
						size='xs'
					>
						Delete
					</Button>
				)}
				<Button
					onClick={async () => {
						const channel = await descriptor.getChannel()
						handleJoinChannel(channel)
					}}
					variantColor='teal'
					size='xs'
				>
					Join
				</Button>
				<br />
				<li>name: {descriptor.friendlyName}</li>
				<li>status: {descriptor.status}</li>
				<li>membersCount: {descriptor.membersCount}</li>
				<li>messagesCount: {descriptor.messagesCount}</li>
				<li>
					lastConsumedMessageIndex: {descriptor.lastConsumedMessageIndex ?? 0}
				</li>
				<li>unreadMessagesCount: {descriptor.unreadMessageCount ?? 0}</li>
				<li>lastMessage: {descriptor.lastMessage}</li>
				<li>createdBy: {descriptor.createdBy}</li>
				<li>dateCreated: {descriptor.dateCreated.toLocaleString()}</li>
				<li>dateUpdated: {descriptor.dateUpdated.toLocaleString()}</li>
			</div>
		)
	}

	return (
		<div>
			ChannelsIndex
			<Button onClick={navigateCreate} variantColor='teal' size='xs'>
				Create
			</Button>
			<br />
			<Accordion allowToggle>
				{/* <AccordionItem>
					<AccordionHeader>
						<Box flex='1' textAlign='left'>
							MyChannels
						</Box>
						<AccordionIcon />
					</AccordionHeader>
					<AccordionPanel pb={4}>
						{loading ? (
							<Loading />
						) : (
							uChannels
								?.filter((descriptor) => descriptor.createdBy === identity)
								?.map((descriptor, i) => renderChannels(descriptor))
						)}
					</AccordionPanel>
				</AccordionItem> */}

				<AccordionItem>
					<AccordionHeader>
						<Box flex='1' textAlign='left'>
							UserChannels
						</Box>
						<AccordionIcon />
					</AccordionHeader>
					<AccordionPanel pb={4}>
						{loading ? (
							<Loading />
						) : (
							uChannels?.map((descriptor, i) => renderChannels(descriptor))
						)}
					</AccordionPanel>
				</AccordionItem>

				{/* <AccordionItem>
					<AccordionHeader>
						<Box flex='1' textAlign='left'>
							PublicChannels
						</Box>
						<AccordionIcon />
					</AccordionHeader>
					<AccordionPanel pb={4}>
						{loading ? (
							<Loading />
						) : (
							pChannels?.map((descriptor, i) => renderChannels(descriptor))
						)}
					</AccordionPanel>
				</AccordionItem> */}

				{/* <AccordionItem>
					<AccordionHeader>
						<Box flex='1' textAlign='left'>
							SubscribedChannels
						</Box>
						<AccordionIcon />
					</AccordionHeader>
					<AccordionPanel pb={4}>
						{loading ? (
							<Loading />
						) : (
							sChannels?.map((descriptor, i) => renderChannels(descriptor))
						)}
					</AccordionPanel>
				</AccordionItem> */}

				{/* <AccordionItem>
					<AccordionHeader>
						<Box flex='1' textAlign='left'>
							LocalChannels
						</Box>
						<AccordionIcon />
					</AccordionHeader>
					<AccordionPanel pb={4}>
						{loading ? (
							<Loading />
						) : (
							lChannels?.map((descriptor, i) => renderChannels(descriptor))
						)}
					</AccordionPanel>
				</AccordionItem> */}
			</Accordion>
		</div>
	)
}
