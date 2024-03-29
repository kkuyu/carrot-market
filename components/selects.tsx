import type { HTMLAttributes } from "react";
import { useRef, useState, useEffect } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
// @libs
import { clearTimer, setTimer, TimerRef } from "@libs/utils";
import usePanel from "@libs/client/usePanel";
// @components
import BottomPanel, { BottomPanelProps, BottomSheetProps } from "@components/commons/panels/case/bottomPanel";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

interface OptionGroupItem<T> {
  label: string;
  options: {
    value: T;
    text: string;
  }[];
}

interface SelectsProps<T> extends HTMLAttributes<HTMLSelectElement> {
  type?: "dropdown" | "bottomPanel";
  name: string;
  placeholder: string;
  initialValue: T;
  updateValue: (value: T) => void;
  optionGroups: OptionGroupItem<T>[];
  required?: boolean;
  register?: UseFormRegisterReturn;
}

const Selects = <T extends string | number>(props: SelectsProps<T>) => {
  const { type = "bottomPanel", name, placeholder, initialValue, updateValue, optionGroups, required = false, register, className = "", ...restProps } = props;
  const { openPanel, closePanel } = usePanel();

  // variable: invisible
  const [selectState, setSelectState] = useState<{ isOpen: boolean; currentValue: T }>({ isOpen: false, currentValue: initialValue });
  const currentText = optionGroups.flatMap((group) => group.options).find((option) => option.value === selectState.currentValue)?.text || placeholder;

  // variable: ref
  const delayTimer: TimerRef = useRef(null);
  const combobox = useRef<HTMLButtonElement>(null);
  const listbox = useRef<HTMLDivElement>(null);

  const toggleCombobox = () => {
    clearTimer(delayTimer);
    setSelectState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const toggleDropdown = async () => {
    await setTimer(delayTimer, 0);
    if (selectState.isOpen && listbox.current) listbox.current.focus();
    if (!selectState.isOpen && combobox.current) combobox.current.focus();
  };

  const toggleBottomPanel = async () => {
    if (selectState.isOpen) {
      const BottomSheet = ({ ...props }: BottomSheetProps) => {
        const { closeBottomPanel } = props;
        return (
          <>
            <strong className="block text-lg font-semibold">{placeholder}</strong>
            <CustomListbox
              lists={optionGroups}
              selectItem={async (item) => {
                updateValue(item.value);
                setSelectState((prev) => ({ ...prev, currentValue: item.value }));
                if (closeBottomPanel) await closeBottomPanel();
              }}
            />
          </>
        );
      };
      openPanel<BottomPanelProps>(BottomPanel, "selectBottomPanel", {
        children: <BottomSheet />,
        closePanel: () => setSelectState((prev) => ({ ...prev, isOpen: false })),
      });
    } else {
      closePanel(BottomPanel, "selectBottomPanel");
    }
  };

  useEffect(() => {
    if (type === "dropdown") toggleDropdown();
    if (type === "bottomPanel") toggleBottomPanel();
  }, [selectState.isOpen]);

  if (!optionGroups) return null;

  const CustomListbox = (props: { lists: OptionGroupItem<T>[]; selectItem: (item: OptionGroupItem<T>["options"][number]) => void } & HTMLAttributes<HTMLDivElement>) => {
    const { lists, selectItem, className: listboxClassName = "", ...listboxRestProps } = props;
    const CustomOption = (props: { item: OptionGroupItem<T>["options"][number] } & HTMLAttributes<HTMLButtonElement>) => {
      const { item, className: optionClassName = "" } = props;
      return (
        <Buttons
          role="option"
          tag="button"
          type="button"
          sort="text-link"
          status="unset"
          onClick={() => selectItem(item)}
          className={`w-full text-left hover:font-semibold ${optionClassName}`}
          aria-selected={item.value === selectState.currentValue}
        >
          {item.text}
        </Buttons>
      );
    };
    return (
      <div ref={listbox} role="listbox" className={`${listboxClassName}`} {...listboxRestProps}>
        {lists.map((list, index) => {
          if (lists.length === 1) return list.options.map((item) => <CustomOption key={item.value} item={item} className="py-0.5" />);
          return (
            <div key={list.label} role="group" aria-labelledby={`${name}-${index}`}>
              <span role="presentation" id={`${name}-${index}`} className={`block text-gray-500`}>
                {list.label}
              </span>
              {list.options.map((item) => (
                <CustomOption key={item.value} item={item} className="py-0.5" />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* combobox: custom */}
      <button
        ref={combobox}
        type="button"
        id={name}
        onClick={toggleCombobox}
        className={`relative w-full px-3 py-2 text-left border rounded-md outline-none
        ${selectState.isOpen ? "border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,1)]" : "border-gray-300"}
        ${selectState.isOpen ? "focus:border-orange-800 focus:shadow-[0_0_0_1px_rgba(194,65,11,1)]" : "focus:border-orange-500 focus:shadow-[0_0_0_1px_rgba(249,115,22,1)]"}
        ${className}`}
        aria-expanded={selectState.isOpen ? "true" : "false"}
        aria-haspopup="listbox"
      >
        <span className={`${selectState.currentValue ? "text-black" : "text-gray-500"}`}>{currentText}</span>
        <span className={`absolute top-1/2 right-3 -translate-y-1/2 ${selectState.isOpen ? "rotate-180" : "rotate-0"}`} aria-hidden="true">
          <Icons name="ChevronDown" className="w-5 h-5" />
        </span>
      </button>
      {/* dropdown: custom */}
      {type === "dropdown" && selectState.isOpen && (
        <div className="mt-3">
          <CustomListbox
            lists={optionGroups}
            selectItem={(item) => {
              updateValue(item.value);
              setSelectState(() => ({ isOpen: false, currentValue: item.value }));
            }}
            className="max-h-28 py-2 px-3 border border-gray-300 rounded-md overflow-y-scroll focus:outline focus:outline-1"
            tabIndex={0}
          />
        </div>
      )}
      {/* select: original */}
      <select className="hidden" {...register} name={name} required={required} {...restProps}>
        <option value="">{placeholder}</option>
        {optionGroups.map((group) => {
          if (optionGroups.length === 1)
            return group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.text}
              </option>
            ));
          return (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
};

export default Selects;
