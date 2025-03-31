import { useState } from "preact/hooks";
import { Input, Button, Tooltip, Card, Divider } from "antd";
import { Info, SendHorizontal } from "lucide-preact";
import styled, { keyframes } from "styled-components";

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  };

  return [storedValue, setValue];
};

const ApiKey = () => {
  const [apiKey, setApiKey] = useLocalStorage("api_key", "");

  const handleSetApiKey = () => {
    // Example function to save API key
    setApiKey(apiKey);
  };

  return (
    <Card
      title={
        <label
          style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
        >
          <b style={{ paddingRight: "8px" }}>API Key</b>
          <Tooltip title="Set your API Key" color="green">
            <Info size={18} />
          </Tooltip>
        </label>
      }
      style={{ padding: 0 }}
    >
      <InputButtonContainer>
        <Input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API Key"
        />
        <Button type="primary" onClick={handleSetApiKey}>
          Set API Key <SendHorizontal size={20} />
        </Button>
      </InputButtonContainer>
      <Divider />
    </Card>
  );
};

const InputButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: 10px;
`;

export default ApiKey;
