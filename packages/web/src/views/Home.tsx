import { Box, SimpleGrid, Heading, Text, VStack } from "@chakra-ui/react";
import { SectionCard } from "../components/SectionCard";
import { LuUsers, LuLock, LuActivity, LuShieldAlert   } from "react-icons/lu";


export function HomeView() {
  return (
    <Box>
      <VStack gap="6" align="flex-start" mb="12">
        <Heading 
          size="4xl" 
          fontWeight="extrabold" 
          letterSpacing="tight"
          bgGradient="to-r"
          gradientFrom="blue.600"
          gradientTo="cyan.400"
          bgClip="text"
        >
          Bienvenido a Alentapp
        </Heading>
        <Text fontSize="xl" color="fg.muted" maxW="2xl">
          El panel de administración central para gestionar todos los aspectos de tu club. 
          Selecciona una sección a continuación para comenzar.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="8">
        <SectionCard 
          title="Miembros"
          description="Administra el padrón de socios, sus categorías, estados de cuenta y datos personales."
          to="/members"
          icon={LuUsers}
        />
        <SectionCard
          title="Lockers"
          description="Administra los lockers del club, su estado y la asignación a socios."
          to="/lockers"
          icon={LuLock}
        />
        <SectionCard
          title="Deportes"
          description="Administra el catálogo de deportes, sus reglas, cupos y precios."
          to="/sports"
          icon={LuActivity}
        />
        <SectionCard
          title="Disciplinas"
          description="Registra y gestioná las sanciones disciplinarias aplicadas a los socios del club."
          to="/disciplines"
          icon={LuShieldAlert}
        />
      </SimpleGrid>
    </Box>
  );
}
