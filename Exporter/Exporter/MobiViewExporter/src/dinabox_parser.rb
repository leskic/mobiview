# encoding: UTF-8

module MobiViewExporter

  module DinaboxParser

    extend self

    ############################################################
    # Entrada principal
    ############################################################

    def parse(entity)

      return nil unless entity

      dict = Utils.dynamic_attributes(entity)

      return nil unless dict

      raw = dict["dinabox_dados"]

      return nil if raw.nil?

      raw = raw.to_s.strip

      return nil if raw.empty?

      type = detect_type(raw)

      data = split_record(raw)

      {

        type: type,

        raw: raw,

        values: data,

        parsed: parse_fields(type, data)

      }

    end

    ############################################################
    # Tipo
    ############################################################

    def detect_type(raw)

      return "piece" if raw.start_with?("[P]")

      return "module" if raw.start_with?("[M]")

      return "hardware" if raw.start_with?("[F]")

      return "unknown"

    end

    ############################################################
    # Remove marcadores
    ############################################################

    def split_record(raw)

      text = raw.gsub(/\[\/?[A-Z]\]/,"")

      text.split("#")

    end

    ############################################################
    # Campos conhecidos
    ############################################################

    def parse_fields(type,data)

      case type

      when "piece"

        {

          family: value(data,0),

          description: value(data,1),

          value1: number(data,2),

          value2: number(data,3),

          value3: number(data,4),

          edge1: value(data,5),

          edge2: value(data,6),

          edge3: value(data,7),

          edge4: value(data,8),

          material: value(data,9),

          grain: value(data,10),

          face: value(data,11),

          machining: value(data,12),

          material2: value(data,13),

          code: value(data,14)

        }

      when "module"

        {

          family: value(data,0),

          description: value(data,1),

          unused: value(data,2),

          value1: number(data,3),

          value2: number(data,4),

          value3: number(data,5),

          quantity: value(data,6),

          version: value(data,7),

          code: value(data,8),

          module_id: value(data,9)

        }

      else

        {}

      end

    end

    ############################################################
    # BoundingBox
    ############################################################

    def bounding_box(entity)

      bb = entity.bounds

      x = bb.width.to_mm.round(1)

      y = bb.depth.to_mm.round(1)

      z = bb.height.to_mm.round(1)

      values = [x,y,z].sort

      {

        x: x,

        y: y,

        z: z,

        smallest: values[0],

        middle: values[1],

        largest: values[2]

      }

    end

    ############################################################
    # Auxiliares
    ############################################################

    def value(array,index)

      return nil if index >= array.length

      v = array[index]

      return nil if v.nil?

      v = v.strip

      return nil if v.empty?

      v

    end

    def number(array,index)

      v = value(array,index)

      return nil unless v

      v.to_f

    end

  end

end