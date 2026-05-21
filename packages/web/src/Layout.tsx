import { Provider } from './components/ui/provider';
import { Toaster } from './components/ui/toaster';
import { Box, Container, Flex, Text, HStack } from '@chakra-ui/react';

import { Outlet, Link as RouterLink } from "react-router";

function Layout() {
    return (
        <Provider>
            <Box as="nav" borderBottomWidth="1px" py="4" px="8" bg="bg.panel" boxShadow="sm" position="sticky" top="0" zIndex="docked">
                <Flex justify="space-between" align="center" maxW="7xl" mx="auto">
                    <RouterLink to="/">
                        <Text 
                            fontSize="2xl" 
                            fontWeight="bold" 
                            bgGradient="to-r" 
                            gradientFrom="blue.600" 
                            gradientTo="cyan.500" 
                            bgClip="text"
                        >
                            Alentapp
                        </Text>
                    </RouterLink>
                    <HStack gap="10">
                        <RouterLink to="/members">
                            <Text
                                fontWeight="semibold"
                                fontSize="sm"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                color="fg.muted"
                                _hover={{ color: "blue.500", textDecoration: "none" }}
                            >
                                Miembros
                            </Text>
                        </RouterLink>
                        <RouterLink to="/lockers">
                            <Text
                                fontWeight="semibold"
                                fontSize="sm"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                color="fg.muted"
                                _hover={{ color: "blue.500", textDecoration: "none" }}
                            >
                                Lockers
                            </Text>
                        </RouterLink>
                        <RouterLink to="/disciplines">
                            <Text
                                fontWeight="semibold"
                                fontSize="sm"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                color="fg.muted"
                                _hover={{ color: "blue.500", textDecoration: "none" }}
                            >
                                Disciplinas
                            </Text>
                        </RouterLink>
                        <RouterLink to="/medical-certificates">
                            <Text
                                fontWeight="semibold"
                                fontSize="sm"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                color="fg.muted"
                                _hover={{ color: "blue.500", textDecoration: "none" }}
                            >
                                Certificados Médicos
                            </Text>
                        </RouterLink>
                       <RouterLink to="/payments">
                            <Text 
                                fontWeight="semibold" 
                                fontSize="sm" 
                                textTransform="uppercase" 
                                letterSpacing="wider"
                                color="fg.muted"
                                _hover={{ color: "blue.500", textDecoration: "none" }}
                            >
                                Pagos
                            </Text>
                        </RouterLink>
                    </HStack>
                </Flex>
            </Box>
            <Container maxW="7xl" py="10">
                <Outlet />
            </Container>
            <Toaster />
        </Provider>
    );
}
export default Layout;
