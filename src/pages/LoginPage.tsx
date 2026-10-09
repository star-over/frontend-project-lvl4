import { Anchor, Card, Center, Container, Image, SimpleGrid, Text } from "@mantine/core";
import { Link } from "react-router";

import logo from "../assets/Login.jpeg";
import { LoginForm } from "../components/LoginForm.tsx";

export const LoginPage = () => (
  <Container size="md" py="xl">
    <Card shadow="sm" withBorder padding="xl">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Center>
          <Image src={logo} radius="50%" alt="login" maw={250} />
        </Center>
        <LoginForm />
      </SimpleGrid>
      <Card.Section withBorder inheritPadding py="md" mt="xl">
        <Text ta="center">
          Нет аккаунта?{" "}
          <Anchor component={Link} to="/signup">
            Регистрация
          </Anchor>
        </Text>
      </Card.Section>
    </Card>
  </Container>
);
