import { useEffect, useState } from "react";
import {
  Button,
  Container,
  ContentLayout,
  Input,
} from "@cloudscape-design/components";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-universal";
import { JSONPath } from "jsonpath-plus";

function App() {
  const [content, setContent] = useState(<></>);
  const [traceId, setTraceId] = useState("");
  const [lastUpdateDate, setLastUpdateDate] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [region, setRegion] = useState("ap-northeast-1");
  const [jsonPath, setJsonPath] = useState("$..resource_arn");

  useEffect(() => {
    (async () => {
      const apiUrl = new URL(`https://xray.${region}.amazonaws.com/Traces`);
      const signatureV4 = new SignatureV4({
        service: "xray",
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken: sessionToken === "" ? undefined : sessionToken,
        },
        sha256: Sha256,
      });
      const httpRequest = new HttpRequest({
        headers: {
          "content-type": "application/json",
          host: apiUrl.hostname,
        },
        hostname: apiUrl.hostname,
        method: "POST",
        path: apiUrl.pathname,
        body: JSON.stringify({
          TraceIds: [traceId],
        }),
      });

      const signedRequest = await signatureV4.sign(httpRequest);

      console.log({ signedRequest });

      const response = await fetch(apiUrl.toString(), {
        headers: signedRequest.headers,
        method: "POST",
        body: JSON.stringify({
          TraceIds: [traceId],
        }),
      });

      const jsonBody = await response.json();

      console.log(jsonBody);

      const data = [];

      const documents = JSONPath({ path: "$..Document", json: jsonBody });
      for (const document of documents) {
        data.push(...JSONPath({ path: jsonPath, json: JSON.parse(document) }));
      }

      setContent(
        <ContentLayout>
          {data.map((item) => (
            <Container>{item}</Container>
          ))}
        </ContentLayout>
      );
    })().then(() => {});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdateDate]);

  return (
    <>
      <Container>
        <Input
          placeholder="TraceID"
          onChange={({ detail }) => setTraceId(detail.value)}
          value={traceId}
        />
        <Input
          placeholder="Region"
          onChange={({ detail }) => setRegion(detail.value)}
          value={region}
        />
        <Input
          placeholder="AccessKeyId"
          onChange={({ detail }) => setAccessKeyId(detail.value)}
          value={accessKeyId}
        />
        <Input
          placeholder="SecretAccessKey"
          onChange={({ detail }) => setSecretAccessKey(detail.value)}
          value={secretAccessKey}
        />
        <Input
          placeholder="SessionToken"
          onChange={({ detail }) => setSessionToken(detail.value)}
          value={sessionToken}
        />
        <Input
          placeholder="JSONPath"
          onChange={({ detail }) => setJsonPath(detail.value)}
          value={jsonPath}
        />
        <Button
          onClick={() => {
            setLastUpdateDate(new Date().toISOString());
          }}
        >
          Update
        </Button>
      </Container>
      {content}
    </>
  );
}

export default App;
