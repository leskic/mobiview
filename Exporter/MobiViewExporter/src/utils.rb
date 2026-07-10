# encoding: UTF-8

module MobiViewExporter

  module Utils

    extend self

    ############################################################
    # ATTRIBUTE DICTIONARIES
    ############################################################

    def dictionary(entity, name)

      entity.attribute_dictionary(name, false)

    end

    def definition_dictionary(entity, name)

      return nil unless entity.respond_to?(:definition)

      entity.definition.attribute_dictionary(name, false)

    end

    def dynamic_attributes(entity)

      dictionary(entity, "dynamic_attributes")

    end

    def dynamic_definition_attributes(entity)

      definition_dictionary(entity, "dynamic_attributes")

    end

    ############################################################
    # BUSCA ATRIBUTO
    ############################################################

    def get_attr(entity, key)

      dict = dynamic_attributes(entity)

      if dict

        value = dict[key]

        return value unless value.nil?
        return value unless value.to_s.empty?

      end

      dict = dynamic_definition_attributes(entity)

      if dict

        value = dict[key]

        return value unless value.nil?
        return value unless value.to_s.empty?

      end

      nil

    end

    ############################################################
    # BUSCA MÚLTIPLA
    ############################################################

    def get_first(entity, *keys)

      keys.each do |key|

        value = get_attr(entity, key)

        return value unless value.nil?

      end

      nil

    end

    ############################################################
    # CONVERSÕES
    ############################################################

    def cm_to_mm(value)

      return nil if value.nil?

      return nil if value.to_s.strip.empty?

      (value.to_f * 10.0).round(1)

    end

    ############################################################
    # UUID
    ############################################################

    def build_uuid(index)

      format("mv_%06d", index)

    end

    ############################################################
    # CÓDIGO
    ############################################################

    def piece_code(entity)

      get_first(

        entity,

        "codigo",

        "_codigo",

        "cod"

      )

    end

    ############################################################
    # NOME
    ############################################################

    def piece_name(entity)

      get_first(

        entity,

        "name",

        "_name",

        "db01",

        "descricao"

      )

    end

    ############################################################
    # MATERIAL
    ############################################################

    def material(entity)

      get_first(

        entity,

        "material",

        "mf",

        "_material"

      )

    end

    ############################################################
    # MÓDULO
    ############################################################

    def module_id(entity)

      get_first(

        entity,

        "moduloid",

        "modulo",

        "_moduloid"

      )

    end

    ############################################################
    # MEDIDAS (Fallback)
    ############################################################

    def width(entity)

      cm_to_mm(

        get_first(

          entity,

          "largura",

          "lar",

          "_largura"

        )

      )

    end

    def height(entity)

      cm_to_mm(

        get_first(

          entity,

          "altura",

          "alt",

          "_altura"

        )

      )

    end

    def depth(entity)

      cm_to_mm(

        get_first(

          entity,

          "profundidade",

          "prof",

          "p"

        )

      )

    end

    def thickness(entity)

      cm_to_mm(

        get_first(

          entity,

          "espessura",

          "pesp",

          "esp"

        )

      )

    end

    ############################################################
    # BOUNDING BOX
    ############################################################

    def bounding_box(entity)

      bb = entity.bounds

      {

        x: bb.width.to_mm.round(1),

        y: bb.depth.to_mm.round(1),

        z: bb.height.to_mm.round(1)

      }

    end

  end

end