import { Anchor, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <Stack align="center" py="xl">
      <Title order={2} c="dimmed">
        {t("notFound.title")}
      </Title>
      <Text c="dimmed">
        {t("notFound.hint")}{" "}
        <Anchor component={Link} to="/">
          {t("notFound.homeLink")}
        </Anchor>
      </Text>
    </Stack>
  );
};
