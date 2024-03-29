import type { ReactElement } from "react";
import { useState, useMemo } from "react";
// @components
import { CommonDispatch, CommonState } from "@components/commons";
import { CommonDispatchContext, CommonStateContext } from "@components/commons/commonContext";
import ModalWrapper from "@components/commons/modals/modalWrapper";
import PanelWrapper from "@components/commons/panels/panelWrapper";
import ToastWrapper from "@components/commons/toasts/toastWrapper";

interface CommonProviderProps {
  children: ReactElement;
}

const CommonProvider = (props: CommonProviderProps) => {
  const { children } = props;

  const [currentState, setCurrentState] = useState<CommonState>(
    new Map([
      ["Modal", []],
      ["Panel", []],
      ["Toast", []],
    ])
  );

  const open: CommonDispatch["open"] = (Type, Component, name, props) => {
    setCurrentState((stated) => {
      return new Map(
        [...stated].map(([key, structure]) => {
          if (key !== Type) return [key, structure];
          if (structure.find((item) => item.name === name)) return [key, structure];
          return [key, [...structure, { Type, Component, name, props }]];
        })
      );
    });
  };

  const close: CommonDispatch["close"] = (Type, Component, name) => {
    setCurrentState((stated) => {
      return new Map(
        [...stated].map(([key, structure]) => {
          return [key, structure.filter((item) => !(item.Type === Type && item.name === name && item.Component === Component))];
        })
      );
    });
  };

  const dispatch = useMemo(() => ({ open, close }), []);

  return (
    <CommonStateContext.Provider value={currentState}>
      <CommonDispatchContext.Provider value={dispatch}>
        {children}
        <ModalWrapper />
        <PanelWrapper />
        <ToastWrapper />
      </CommonDispatchContext.Provider>
    </CommonStateContext.Provider>
  );
};

export default CommonProvider;
