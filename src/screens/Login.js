import React, { useState } from 'react'
import { Input, Button, useToast } from '@chakra-ui/core'

import { useAuth } from '../context/useAuth'
import { useTwilio } from '../hooks/useTwilio'

export function Login() {
	const { login } = useAuth()
	const { createToken } = useTwilio({})

	const toast = useToast()

	const [email, setEmail] = useState('chnirt@gmail.com')
	// const [email, setEmail] = useState('development.account@urbanos.io')

	async function handleLogin() {
		// fetch("https://xj579.sse.codesandbox.io/token", {
		//   method: "post",
		//   body: JSON.stringify({ username: email })
		// })
		//   .then((response) => {
		//     if (!response.ok) {
		//       throw Error(response.statusText);
		//     }
		//     return response;
		//   })
		//   .then((res) => res.json())
		//   .then((data) => {
		//     const { token } = data;
		//     login(email, token);
		//   })
		//   .catch((error) => console.log(error.message));
		const token = createToken(email)
		const result = await login(email, token)
		if (result) {
			toast({
				title: 'Login.',
				description: 'Login successfully',
				status: 'success',
				duration: 1000,
				isClosable: true,
			})
		}
	}

	return (
		<div>
			Login page
			<Input
				placeholder='Email'
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>
			<Button onClick={handleLogin} variantColor='teal' size='xs'>
				Login
			</Button>
		</div>
	)
}
