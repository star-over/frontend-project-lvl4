import { Card, Center, Container, Image, SimpleGrid } from "@mantine/core";
import type { ReactNode } from "react";

type Props = { image: string; alt: string; children: ReactNode; footer?: ReactNode };

// Карточка страниц входа и регистрации: картинка слева, форма справа, подвал снизу.
export const AuthCard = ({ image, alt, children, footer }: Props) => (
  <Container size="md" py="xl">
    <Card shadow="sm" withBorder padding="xl">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Center>
          <Image src={image} radius="50%" alt={alt} maw={250} />
        </Center>
        {children}
      </SimpleGrid>
      {footer && (
        <Card.Section withBorder inheritPadding py="md" mt="xl">
          {footer}
        </Card.Section>
      )}
    </Card>
  </Container>
);
