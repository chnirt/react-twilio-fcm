import React, { useState } from 'react'
import { Input, Button } from '@chakra-ui/core'
import { useNavigate } from 'react-router-dom'

import { useTwilio } from '../hooks/useTwilio'

export function CreateChannel() {
	const identity = localStorage.getItem('username')

	const { createChannel } = useTwilio({ identity })
	let navigate = useNavigate()

	const [friendlyName, setFriendlyName] = useState('')

	function navigateList() {
		navigate('/')
	}

	async function handleSave() {
		const newChannel = await createChannel(friendlyName)
		newChannel && navigate('/')
	}

	return (
		<div>
			<Button onClick={navigateList} variantColor='teal' size='xs'>
				List
			</Button>
			CreateChannel
			<br />
			<Input
				placeholder='FriendlyName'
				value={friendlyName}
				onChange={(e) => setFriendlyName(e.target.value)}
			/>
			<Button onClick={handleSave} variantColor='teal' size='xs'>
				Save
			</Button>
		</div>
	)
}
